import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { twitch_controller } from "./controller/twitch_controller";
import { enviarMensaje } from "./controller/controller_mensajes";
import { sendDiscordNotification, sendPhaseChangeNotification } from "./controller/discord_webhook";
import "./index.css";
import { formatTime } from "./components/utils/formatTime";
import campana from "./components/utils/campana.mp3";

// Lazy loading de componentes
const News = lazy(() => import("./components/News"));
const Qrcode = lazy(() => import("./components/Qrcode"));

const DURATIONS = {
  INICIANDO: 10 * 60,
  PRODUCTIVO: 90 * 60,
  DESCANSO: 15 * 60,
  TERMINADO: 0,
};

const App = () => {
  const [timeLeft, setTimeLeft] = useState(DURATIONS.INICIANDO);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState("INICIANDO");
  const [pomodorosCompleted, setPomodorosCompleted] = useState(1);
  const [totalPomodoros, setTotalPomodoros] = useState(4);
  const [mode, setMode] = useState("auto");
  const [backgroundImage, setBackgroundImage] = useState("descanso");
  const [aviso, setAviso] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [location] = useState("Córdoba, Argentina");

  // refs
  const qrValueRef = useRef("");
  const Client = useRef(null);
  const audioRef = useRef(null);
  const greetedUsers = useRef(new Set());

  // Timer refs to avoid drift
  const timerRef = useRef(null);
  const startTimestampRef = useRef(null);
  const endTimestampRef = useRef(null);
  const remainingBeforeStartRef = useRef(DURATIONS.INICIANDO);
  const isRunningRef = useRef(isRunning);
  const modeRef = useRef(mode);
  const hasSentInitialMessage = useRef(false);
  const hasAutoStartedRef = useRef(false);

  // Función para limpiar localStorage antiguo
  const cleanupOldStorage = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      keys.forEach(key => {
        if (key.startsWith('pomodoroState')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.timestamp && (now - data.timestamp > maxAge)) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Si hay error en parse, eliminar la clave corrupta
            localStorage.removeItem(key);
          }
        }
      });
    } catch (e) {
      console.warn('Error limpiando localStorage:', e);
    }
  }, []);

  // Efecto para cargar el estado guardado al inicio
  useEffect(() => {
    cleanupOldStorage();
    
    const savedState = localStorage.getItem('pomodoroState');
    if (savedState) {
      const state = JSON.parse(savedState);
      // Verificar que el estado no sea demasiado viejo (más de 1 hora)
      if (Date.now() - state.timestamp < 3600000) {
        setTimeLeft(state.timeLeft);
        setIsRunning(state.isRunning);
        setPhase(state.phase);
        setPomodorosCompleted(state.pomodorosCompleted);
        setTotalPomodoros(state.totalPomodoros);
        setMode(state.mode);
        setBackgroundImage(state.backgroundImage);
        remainingBeforeStartRef.current = state.remainingBeforeStart;
        hasAutoStartedRef.current = state.hasAutoStarted;
        isRunningRef.current = state.isRunning;
        modeRef.current = state.mode;
      } else {
        // Si el estado es viejo, limpiar
        localStorage.removeItem('pomodoroState');
      }
    }
  }, [cleanupOldStorage]);

  // Función para guardar el estado con validación
  const saveState = useCallback(() => {
    try {
      const stateToSave = {
        timeLeft,
        isRunning,
        phase,
        pomodorosCompleted,
        totalPomodoros,
        mode,
        backgroundImage,
        remainingBeforeStart: remainingBeforeStartRef.current,
        hasAutoStarted: hasAutoStartedRef.current,
        timestamp: Date.now()
      };
      
      // Validar que los datos sean válidos antes de guardar
      if (typeof stateToSave.timeLeft === 'number' && 
          typeof stateToSave.phase === 'string' &&
          typeof stateToSave.timestamp === 'number') {
        localStorage.setItem('pomodoroState', JSON.stringify(stateToSave));
      }
    } catch (e) {
      console.warn('Error guardando estado:', e);
      // Si hay error, limpiar localStorage para evitar corrupción
      try {
        localStorage.removeItem('pomodoroState');
      } catch (cleanupError) {
        console.warn('Error limpiando localStorage:', cleanupError);
      }
    }
  }, [timeLeft, isRunning, phase, pomodorosCompleted, totalPomodoros, mode, backgroundImage]);

  // Efecto para guardar el estado cuando cambie
  useEffect(() => {
    saveState();
  }, [saveState, timeLeft, isRunning, phase, pomodorosCompleted, totalPomodoros, mode]);

  // Efecto para limpiar el estado cuando se complete la sesión
  useEffect(() => {
    if (phase === "🌳HEMOS TERMINADO🌳" && timeLeft === 0) {
      localStorage.removeItem('pomodoroState');
    }
  }, [phase, timeLeft]);

  // Inicializar audio una vez
  useEffect(() => {
    audioRef.current = new Audio(campana);
    audioRef.current.preload = "auto";
  }, []);

  // Actualizar referencias de estados que usamos en refs
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      setCurrentDate(now.toLocaleDateString("es-AR", options));
    };

    updateDateTime();
    const id = setInterval(updateDateTime, 1000);
    return () => {
      if (id) clearInterval(id);
    };
  }, []);

  // Helper: establecer endTimestamp y startTimestamp en base a remainingBeforeStartRef
  const startWithRemaining = useCallback((remainingSeconds) => {
    const now = Date.now();
    startTimestampRef.current = now;
    endTimestampRef.current = now + remainingSeconds * 1000;
    remainingBeforeStartRef.current = remainingSeconds;
  }, []);

  // Calcular remaining usando timestamps - evita drift
  const computeRemaining = useCallback(() => {
    if (!endTimestampRef.current) return Math.max(0, Math.ceil(remainingBeforeStartRef.current));
    const ms = endTimestampRef.current - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
  }, []);

  // Manejo de cambio de fase
  const handlePhaseSwitch = useCallback(() => {
    // Detener interval para evitar overlapping
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reproducir audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => {
        console.debug("audio play failed:", e?.message || e);
      });
    }

    hasSentInitialMessage.current = false;

    // Calculamos la siguiente fase en función de la actual
    let nextPhase = phase;
    let nextRemaining = 0;
    let incrementPomodoro = false;

    switch (phase) {
      case "INICIANDO":
        nextPhase = "💻PRODUCTIVO📋";
        nextRemaining = DURATIONS.PRODUCTIVO;
        break;
      case "💻PRODUCTIVO📋": {
        const newPomodoroCount = pomodorosCompleted + 1;
        if (newPomodoroCount > totalPomodoros) {
          nextPhase = "🌳HEMOS TERMINADO🌳";
          nextRemaining = DURATIONS.DESCANSO;
          incrementPomodoro = false;
        } else {
          nextPhase = "🍵DESCANSO🍙";
          nextRemaining = DURATIONS.DESCANSO;
          incrementPomodoro = true;
        }
        break;
      }
      case "🍵DESCANSO🍙":
        nextPhase = "💻PRODUCTIVO📋";
        nextRemaining = DURATIONS.PRODUCTIVO;
        break;
      case "🌳HEMOS TERMINADO🌳":
        nextPhase = "🌳HEMOS TERMINADO🌳";
        nextRemaining = DURATIONS.TERMINADO;
        break;
      default:
        break;
    }

    // Aplicar la fase calculada
    setPhase(nextPhase);
    setBackgroundImage(nextPhase === "💻PRODUCTIVO📋" ? "productivo" : "descanso");
    if (incrementPomodoro) setPomodorosCompleted((p) => p + 1);

    // Si estamos en modo AUTO y ya hubo un inicio manual (hasAutoStartedRef true),
    // entonces la siguiente fase debe iniciarse automáticamente. Si no, esperar !start.
    if (modeRef.current === "auto" && hasAutoStartedRef.current && nextRemaining > 0) {
      // iniciar timestamps y arrancar
      remainingBeforeStartRef.current = nextRemaining;
      startWithRemaining(nextRemaining);
      setIsRunning(true);
      isRunningRef.current = true;

      // iniciar interval (AUTOMÁTICO) y guardar remaining cada tick
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          const remaining = computeRemaining();
          
          // Guardar el último remaining
          remainingBeforeStartRef.current = remaining;

          setTimeLeft(remaining);
          if (remaining <= 0) {
            // siguiente cambio de fase
            handlePhaseSwitch();
          }
        }, 1000);
      }
    } else {
      // No iniciar automáticamente: solo establecer remaining y esperar !start
      remainingBeforeStartRef.current = nextRemaining;
      setTimeLeft(nextRemaining);
      setIsRunning(false);
      isRunningRef.current = false;

      // Si llegamos al final del circuito, aseguramos que no quede en loop
      if (nextPhase === "🌳HEMOS TERMINADO🌳") {
        hasAutoStartedRef.current = false;
      }
    }

    // Guardar el estado después del cambio de fase
    saveState();
  }, [computeRemaining, pomodorosCompleted, totalPomodoros, phase, startWithRemaining, saveState]);

  // Efecto principal que administra el interval cuando isRunning cambia
  useEffect(() => {
    // limpiar si ya existía
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Si no estamos corriendo, terminar aquí
    if (!isRunning) return;

    // Si no hay endTimestamp (por ejemplo reinicio/crash), restaurarlo usando remainingBeforeStartRef
    if (!endTimestampRef.current) {
      startWithRemaining(remainingBeforeStartRef.current || DURATIONS.INICIANDO);
    }

    // enviar mensaje inicial de fase si corresponde
    if (!hasSentInitialMessage.current && timeLeft > 0) {
      enviarMensaje(phase, pomodorosCompleted, (ch, msg) => {
        if (Client.current) Client.current.say(ch, msg);
      });
      hasSentInitialMessage.current = true;
    }

    // iniciar interval que actualiza timeLeft en base a timestamps
    timerRef.current = setInterval(() => {
      const remaining = computeRemaining();

      // Guardar el último tiempo correcto para poder restaurarlo si se pierde el timestamp
      remainingBeforeStartRef.current = remaining;

      setTimeLeft(remaining);
      if (remaining <= 0) {
        // Dejar que handlePhaseSwitch se encargue de reiniciar o pausar
        handlePhaseSwitch();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, computeRemaining, handlePhaseSwitch, phase, pomodorosCompleted, timeLeft, startWithRemaining]);

  // Efecto que reacciona cuando timeLeft llega a 0 por fuera del tick (solo para mensaje final)
  useEffect(() => {
    if (timeLeft <= 0 && phase === "🌳HEMOS TERMINADO🌳" && isRunningRef.current && Client.current) {
      const channel = import.meta.env.VITE_APP_CHANNELS || "brunispet";
      Client.current.say(channel, "🌳 ¡Hemos terminado la sesión! ¡Gracias por participar!");
    }
  }, [timeLeft, phase]);

  // Start timer
  const startTimer = useCallback(() => {
    // Si ya está corriendo nada que hacer
    // ...
    // Si no hay remaining definido, configurar por fase
    let defaultRemaining = remainingBeforeStartRef.current;
    if (!defaultRemaining || defaultRemaining <= 0) {
      defaultRemaining = phase === "🍵DESCANSO🍙" ? DURATIONS.DESCANSO : phase === "💻PRODUCTIVO📋" ? DURATIONS.PRODUCTIVO : DURATIONS.INICIANDO;
      remainingBeforeStartRef.current = defaultRemaining;
      setTimeLeft(defaultRemaining);
    }

    // Generar timestamps y arrancar
    startWithRemaining(remainingBeforeStartRef.current);
    setIsRunning(true);
    isRunningRef.current = true;

    // Si estamos en modo auto, marcar que auto fue iniciado por el usuario (primera vez)
    if (modeRef.current === "auto") {
      hasAutoStartedRef.current = true;
    }

    // iniciar interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setInterval(() => {
      const remaining = computeRemaining();

      // Guardar el último tiempo correcto
      remainingBeforeStartRef.current = remaining;

      setTimeLeft(remaining);
      if (remaining <= 0) {
        handlePhaseSwitch();
      }
    }, 1000);

    // avisar al chat
    if (Client.current && phase !== "🌳HEMOS TERMINADO🌳") {
      let phaseMessage = "";

      if (phase === "💻PRODUCTIVO📋") {
        phaseMessage = "fase de PRODUCTIVIDAD";
      } else if (phase === "🍵DESCANSO🍙") {
        phaseMessage = "tiempo de DESCANSO";
      } else if (phase === "INICIANDO") {
        phaseMessage = "fase de INICIO";
      }

      // Solo enviar si hay mensaje definido
      if (phaseMessage) {
        const channel = import.meta.env.VITE_APP_CHANNELS || "brunispet";
        Client.current.say(
          channel,
          `⏱️ ¡Temporizador iniciado! ${phaseMessage} en marcha.`
        );
      }
    }

    // Guardar el estado al iniciar
    saveState();
  }, [computeRemaining, phase, startWithRemaining, handlePhaseSwitch, saveState]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // calcular remaining y guardarlo
    const remaining = computeRemaining();
    // Guardamos el remaining antes de anular timestamps
    remainingBeforeStartRef.current = remaining;

    endTimestampRef.current = null;
    startTimestampRef.current = null;

    if (isRunningRef.current) {
      setIsRunning(false);
      isRunningRef.current = false;

      if (Client.current) {
        const remainingStr = formatTime(remaining);
        const channel = import.meta.env.VITE_APP_CHANNELS || "brunispet";
        Client.current.say(channel, `⏸️ Temporizador pausado con ${remainingStr} restantes. Usa !start para reanudar.`);
      }
    }

    // Guardar el estado al pausar
    saveState();
  }, [computeRemaining, saveState]);

  // ...
  useEffect(() => {
    Client.current = twitch_controller();
    
    if (!Client.current) {
      console.error('No se pudo inicializar el cliente de Twitch. Verifica las variables de entorno.');
      return;
    }

    const handleMessage = (channel, tags, message, self) => {
      if (self) return;
      const args = message.split(" ");
      const command = args[0].toLowerCase();
      const username = tags.username;
      const isSub = tags.badges?.subscriber;
      const isVip = tags.badges?.vip;
      const isMod = tags.badges?.moderator;

      if (!greetedUsers.current.has(username) && username.toLowerCase() !== 'cuartodechenz' && username.toLowerCase() !== 'brunispet') {
        greetedUsers.current.add(username);
        const mensajeGeneral = `¡Qué alegría verte por aquí, ${username}! Espero que tengas una jornada productiva. 📚✨`;
        const mensajeSubs = isSub ? `👑 ¡Mil gracias por apoyar este canal! Gracias a ti, las croquetas para mí y los michis están aseguradas. 🐱💕` : `¡Mucho ánimo con todo lo que tengas por delante! 💪📖`;
        const mensajeMod = isMod ? `⚔️ ¡Nuestra comunidad está en buenas manos contigo como mod! Gracias por ayudar a que esto sea un espacio increíble. ✨` : "";
        const mensajeVid = isVip && username !== "mohcitrus" ? `💎 ¡Nos encanta verte por aquí! Tu presencia hace que estos días sean aún más especiales. 🌟` : "";

        Client.current.say(channel, mensajeGeneral + mensajeSubs + mensajeMod + mensajeVid);
      }

      if (!message.startsWith("!")) return;

      // ciertos comandos solo pueden ser usados por el propio usuario o mods
      if (command === "!sala" || command === "!code" || command === "!room" || command === "!salita") {
        if (qrValueRef.current) {
          // Enviar mensaje a Twitch
          const channel = import.meta.env.VITE_APP_CHANNELS || "brunispet";
          Client.current.say(
            channel,
            `🌳CÓDIGO: ${qrValueRef.current.toUpperCase()} - Únete a la sala: https://forestapp.cc/join-room?token=${qrValueRef.current} Por favor desactiva la opción concentración profunda. Si no sabes como hacerlo, te ensañamos. De lo contrario puedes pedirnos una salita con esa funcionalidad activa`
          );
          
          // Enviar notificación a Discord
          sendDiscordNotification(qrValueRef.current, phase, timeLeft, username);
        } else {
          const channel = import.meta.env.VITE_APP_CHANNELS || "brunispet";
          Client.current.say(channel, "No hay un código configurado. Usa !codigo [token] para establecer uno.");
        }
        return;
      }

      const botUsername = import.meta.env.VITE_APP_USERNAME || "brunispet";
      if (tags.username !== "cuartodechenz" && tags.username !== botUsername && !tags.mod) {
        return; // ignorar comandos administrativos
      }

      switch (command) {
        case "!start":
          startTimer();
          break;
        case "!pause":
          pauseTimer();
          break;
        case "!min":
          if (args[1] && !isNaN(args[1])) setMinutes(parseInt(args[1]));
          break;
        case "!pomo":
          if (args[1] && !isNaN(args[1])) setPomodoros(parseInt(args[1]));
          break;
        case "!pomot":
          if (args[1] && !isNaN(args[1])) setTotalPomodorosCount(parseInt(args[1]));
          break;
        case "!mode": {
          // Protección: si justo llegó a 0, bloqueamos el cambio de fase pendiente
          if (timeLeft <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            endTimestampRef.current = null;
          }

          setMode((prevMode) => {
            const updatedMode = prevMode === "auto" ? "manual" : "auto";
            modeRef.current = updatedMode;

            // Limpiar interval siempre
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            if (updatedMode === "manual") {
              // detener y esperar !start
              isRunningRef.current = false;
              setIsRunning(false);

              if (Client.current)
                Client.current.say(channel, `/me 🧭 Cambiado a modo MANUAL. Usa !start para reanudar cuando quieras.`);

              // limpiar bandera auto
              hasAutoStartedRef.current = false;
            } else {
              // modo auto
              hasAutoStartedRef.current = false;

              if (Client.current)
                Client.current.say(channel, `/me 🤖 Cambiado a modo AUTOMÁTICO. Usa !start para iniciar y luego seguirá solo hasta completar el circuito.`);
            }

            saveState();
            return updatedMode;
          });
        }
        break;
        case "!reset":

          try {
            if (Client.current) {
              Client.current.disconnect();
            }
          } catch (e) {}

          Client.current = twitch_controller(); // 🔥 Reconexión REAL
          hasSentInitialMessage.current = false;
          // 1) Limpiar estado persistido
          localStorage.removeItem("pomodoroState");

          // 2) Detener timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // 3) Reset timestamps
          startTimestampRef.current = null;
          endTimestampRef.current = null;
          remainingBeforeStartRef.current = DURATIONS.INICIANDO;

          // 4) Reset estados React
          setPhase("INICIANDO");
          setTimeLeft(DURATIONS.INICIANDO);
          setPomodorosCompleted(1);
          setTotalPomodoros(4);
          hasAutoStartedRef.current = false;

          setIsRunning(false);
          isRunningRef.current = false;

          // 5) Reconectar bot
          // ...

          // 6) Aviso al chat
          if (Client.current) {
            const channel = import.meta.env.VITE_APP_CHANNELS || "brunispet";
            Client.current.say(
              channel,
              "🔄 Timer y bot reiniciados. Iniciando en fase INICIANDO."
            );
          }
        break;
        case "!aviso":
          const messageAviso = args.slice(1).join(" ");
          console.log("Aviso actualizado:", messageAviso);
          setAviso(messageAviso);
          break;
        case "!codigo":
          const token = args.slice(1).join(" ");
          if (!token) {
            const channel = import.meta.env.VITE_APP_CHANNELS || "brunispet";
            Client.current.say(channel, " Debes proporcionar un token válido. Ejemplo: !codigo [token]");
            return;
          }
          qrValueRef.current = token;
          setQrValue(token);
          
          // Enviar notificación a Discord automáticamente
          sendDiscordNotification(token, phase, timeLeft, username);
          
          // Confirmar al chat
          const channel = import.meta.env.VITE_APP_CHANNELS || "brunispet";
          Client.current.say(channel, `Código establecido y notificación enviada a Discord: ${token.toUpperCase()}`);
          break;
        default:
          break;
      }
    };

    Client.current.on("message", handleMessage);

    return () => {
      if (Client.current) {
        try { 
          Client.current.removeListener("message", handleMessage);
          Client.current.disconnect(); 
        } catch (e) { /* ignore */ }
      }
    };
  }, []);

  return (
    <div className="container">
      <div className="element_1">
        <Suspense fallback={<div className="loading-placeholder">Cargando QR...</div>}>
          <Qrcode token={qrValue} />
        </Suspense>
      </div>
      <div className="element_2">
        <Suspense fallback={<div className="loading-placeholder">Cargando noticias...</div>}>
          <News message={aviso} />
        </Suspense>
      </div>
      <div className="element_3">
        <div className={`consola elemente_3_a ${backgroundImage}`}></div>
        <div className="elemente_3_b">
          <div className="item_timer_1">
            <h1>{formatTime(timeLeft)}</h1>
          </div>
          <div className="item_timer_2">
            <div className="item_timer_2_a">
              <h3>{mode}</h3>
            </div>
            <div className="item_timer_2_b">
              <h2>
                {pomodorosCompleted}/{totalPomodoros}
              </h2>
            </div>
          </div>
        </div>
      </div>
      <div className="element_4">
        <div className="element_4_a">
          <h2> {phase}</h2>
        </div>
      </div>
      <div className="localization">
        <span className="localization-text">
          {currentDate} | {currentTime} | {location}
        </span>
      </div>
    </div>
  );
};

export default App;