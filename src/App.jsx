import React, { useState, useEffect, useRef, useCallback } from "react";
import { twitch_controller } from "./controller/twitch_controller";
import { enviarMensaje } from "./controller/controller_mensajes";
import "./index.css";
import { formatTime } from "./components/utils/formatTime";
import News from "./components/News";
import Qrcode from "./components/Qrcode";
import campana from "./components/utils/campana.mp3";

const App = () => {
  const [timeLeft, setTimeLeft] = useState(10 * 60); // Inicialmente 10 minutos (fase de Estamos trabajando /estudiando)
  const [isRunning, setIsRunning] = useState(false); // Para controlar si el temporizador está en marcha
  const [phase, setPhase] = useState("INICIANDO"); // Fase actual (INICIANDO, Estamos trabajando /estudiando, 🍵En descanso🍙, Final de los )
  const [pomodorosCompleted, setPomodorosCompleted] = useState(1); // Contador de pomodoros completados
  const [totalPomodoros, setTotalPomodoros] = useState(4); // Total de pomodoros que se desean completar
  const [mode, setMode] = useState("auto"); // Modo actual: "auto" o "manual"
  const [backgroundImage, setBackgroundImage] = useState("descanso");
  const [aviso, setAviso] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [location, setLocation] = useState('Córdoba, Argentina');
  const qrValueRef = useRef(""); // Usamos useRef para almacenar el código QR
  const Client = useRef(null);
  const audio = new Audio(campana);
  const usersActivities = [];
  const greetedUsers = useRef(new Set()); // Para rastrear usuarios ya saludados

  // Función para enviar mensajes al chat
  const sendMessage = useCallback((channel, message) => {
    if (Client.current) {
      Client.current.say(channel, message).catch((error) => {
        console.error("Error al enviar mensaje:", error);
      });
    }
  }, []);
  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Formatear hora
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
      
      // Formatear fecha
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('es-AR', options));
    };
    
    // Actualizar inmediatamente y luego cada segundo
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Referencia al intervalo del temporizador
  const timerRef = useRef(null);

  // Limpiar intervalo cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Referencia para mantener el estado actual del modo
  const modeRef = useRef(mode);
  const isRunningRef = useRef(isRunning);

  // Actualizar las referencias cuando cambian los estados
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Función para verificar el modo
  const verifyMode = useCallback(() => {
    // Si estamos en modo automático, continuamos con la siguiente fase
    if (modeRef.current === "auto") {
      setIsRunning(true); // Reanudar el temporizador automáticamente
    } else {
      setIsRunning(false); // En modo manual, pausamos el temporizador
    }
  }, []);

  // Cambiar de fase y manejar las transiciones de manera más robusta
  const handlePhaseSwitch = useCallback(() => {
    // Detener el temporizador actual
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reproducir sonido de notificación
    audio.play().catch(error => {
      console.error('Error al reproducir sonido:', error);
    });

    // Resetear el flag de mensaje enviado al cambiar de fase
    hasSentInitialMessage.current = false;

    // Manejar la transición de fase
    switch (phase) {
      case "INICIANDO":
        setPhase("💻PRODUCTIVO📋");
        setTimeLeft(60 * 60);
        setBackgroundImage("productivo");
        break;

      case "💻PRODUCTIVO📋":
        const newPomodoroCount = pomodorosCompleted + 1;
        
        if (newPomodoroCount > totalPomodoros) {
          setPhase("🌳HEMOS TERMINADO🌳");
          setTimeLeft(10 * 60);
          setBackgroundImage("descanso");
        } else {
          setPhase("🍵DESCANSO🍙");
          setTimeLeft(10 * 60);
          setBackgroundImage("descanso");
          setPomodorosCompleted(prev => prev + 1);
        }
        break;

      case "🍵DESCANSO🍙":
        setPhase("💻PRODUCTIVO📋");
        setTimeLeft(60 * 60);
        setBackgroundImage("productivo");
        break;

      case "🌳HEMOS TERMINADO🌳":
        setPhase("🌳HEMOS TERMINADO🌳");
        setTimeLeft(0);
        setBackgroundImage("descanso");
        // No enviar mensaje aquí, se manejará en el efecto de cambio de fase
        break;
    }

    // Verificar el modo y actualizar el estado de ejecución
    verifyMode();
  }, [phase, pomodorosCompleted, totalPomodoros, sendMessage, verifyMode]);

  // Referencia para controlar el envío de mensajes
  const hasSentInitialMessage = useRef(false);

  // Lógica del temporizador mejorada
  useEffect(() => {
    // Función que se ejecutará en cada tick del temporizador
    const tick = () => {
      if (!isRunningRef.current) return;
      
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          handlePhaseSwitch();
          return 0;
        }
        return prevTime - 1;
      });
    };

    // Limpiar intervalo existente si hay uno
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Configurar el temporizador solo si está en modo automático o si se está ejecutando manualmente
    if (isRunning && (modeRef.current === 'auto' || modeRef.current === 'manual')) {
      // Notificar cambio de fase solo si el temporizador está iniciando y no hemos enviado el mensaje inicial
      if (timeLeft > 0 && !hasSentInitialMessage.current) {
        enviarMensaje(phase, pomodorosCompleted, sendMessage);
        hasSentInitialMessage.current = true;
      }

      timerRef.current = setInterval(tick, 1000);
    } else {
      // Resetear el flag cuando el temporizador se detiene
      hasSentInitialMessage.current = false;
    }

    // Limpiar intervalo cuando el efecto se desmonte o cambie la dependencia
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, phase, timeLeft, handlePhaseSwitch, pomodorosCompleted, sendMessage]);

  // Efecto para manejar cambios de fase
  useEffect(() => {
    // Si el tiempo llega a 0, cambiar de fase
    if (timeLeft <= 0) {
      const wasRunning = isRunning;
      handlePhaseSwitch();
      
      // Solo enviar mensaje de finalización si estamos en la fase de terminado
      // y el temporizador estaba en ejecución
      if (phase === "🌳HEMOS TERMINADO🌳" && wasRunning && Client.current) {
        Client.current.say('brunispet', '🌳 ¡Hemos terminado la sesión! ¡Gracias por participar!');
      }
    }
  }, [timeLeft, handlePhaseSwitch, isRunning, phase]);

  // Iniciar o pausar el temporizador de manera más robusta
  const startTimer = useCallback(() => {
    // No hacer nada si ya está corriendo
    if (isRunning) return;
    
    // Si estamos en modo manual y ya hay tiempo restante, simplemente reanudar
    if (mode === "manual" && timeLeft > 0) {
      console.log('Reanudando temporizador manual');
      setIsRunning(true);
      
      // Asegurarse de que el temporizador se reinicie correctamente
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Configurar un nuevo intervalo
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            handlePhaseSwitch();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      return;
    }
    
    // Si no hay tiempo restante, reiniciar con el tiempo predeterminado para la fase actual
    if (timeLeft <= 0) {
      console.log('Reiniciando temporizador con tiempo predeterminado');
      const newTime = phase === "🍵DESCANSO🍙" ? 3 * 60 : 5 * 60; // Ajustado a 3 y 5 minutos según la lógica de las fases
      setTimeLeft(newTime);
    }
    
    // Iniciar el temporizador
    console.log('Iniciando nuevo temporizador');
    setIsRunning(true);
    
    // Asegurarse de que el temporizador se reinicie correctamente
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Configurar un nuevo intervalo
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          handlePhaseSwitch();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // Enviar mensaje de inicio
    if (Client.current) {
      const phaseMessage = phase === "💻PRODUCTIVO📋" ? "fase de PRODUCTIVIDAD" : 
                         phase === "🍵DESCANSO🍙" ? "tiempo de DESCANSO" : "sesión";
      Client.current.say('brunispet', `⏱️ ¡Temporizador iniciado! ${phaseMessage} en marcha.`);
    }
    
  }, [isRunning, mode, phase, timeLeft, handlePhaseSwitch]);

  // Pausar el temporizador de manera segura
  const pauseTimer = useCallback(() => {
    console.log('Pausing timer...');
    
    // Detener el intervalo actual
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Solo actualizar el estado si está corriendo
    if (isRunning) {
      console.log('Deteniendo el temporizador');
      setIsRunning(false);
      
      // Notificar al chat
      if (Client.current) {
        const remainingTime = formatTime(timeLeft);
        Client.current.say('brunispet', `⏸️ Temporizador pausado con ${remainingTime} restantes. Usa !start para reanudar.`);
      }
    }
  }, [isRunning, timeLeft]);

  // Ajustar minutos
  const setMinutes = (minutes) => {
    setTimeLeft(minutes * 60);
  };

  // Ajustar el número de pomodoros completados
  const setPomodoros = (count) => setPomodorosCompleted(count);

  // Ajustar el número total de pomodoros
  const setTotalPomodorosCount = (count) => setTotalPomodoros(count);

  // Controlador de Twitch
  useEffect(() => {
    Client.current = twitch_controller();
    Client.current.on("message", (channel, tags, message, self) => {
      if (self) return; // Ignorar mensajes del propio bot
      const args = message.split(" ");
      const command = args[0].toLowerCase();
      const username = tags.username;
      const isSub = tags.badges?.subscriber;
      const isPrime = tags.badges?.premium;
      const isVip = tags.badges?.vip;
      const isMod = tags.badges?.moderator;
      // Solo saludar si es la primera vez que vemos a este usuario y no es brunispet ni brunispet
      if (!greetedUsers.current.has(username) && 
          username.toLowerCase() !== 'brunispet' && 
          username.toLowerCase() !== 'brunispet') {
        greetedUsers.current.add(username);
        
        const mensajeGeneral = `¡Qué alegría verte por aquí, ${username}! Espero que tengas una jornada productiva. 📚✨`;
        const mensajeSubs = isSub
          ? `👑 ¡Mil gracias por apoyar este canal! Gracias a ti, las croquetas para mí y los michis están aseguradas. 🐱💕`
          : `Espero que tengas una excelente sesión de estudio. ¡Mucho ánimo! 💪📖`;
        const mensajeMod = isMod
          ? `⚔️ ¡Nuestra comunidad está en buenas manos contigo como mod! Gracias por ayudar a que esto sea un espacio increíble. ✨`
          : "";
        const mensajeVid = isVip && username !== "mohcitrus"
          ? `💎 ¡Nos encanta verte por aquí! Tu presencia hace que estos días sean aún más especiales. 🌟`
          : "";
          
        Client.current.say(
          channel,
          mensajeGeneral + mensajeSubs + mensajeMod + mensajeVid
        );
      }

      if (!message.startsWith("!")) return;

      if (
        command === "!sala" ||
        command === "!code" ||
        command === "!room" ||
        command === "!salita"
      ) {
        if (qrValueRef.current) {
          sendMessage(
            "brunispet",
            `🌳CÓDIGO: ${qrValueRef.current.toUpperCase()} - Únete a la sala: https://forestapp.cc/join-room?token=${
              qrValueRef.current
            } Por favor desactiva la opción concentración profunda. Si no sabes como hacerlo, te ensañamos. De lo contrario puedes pedirnos una salita con esa funcionalidad activa`
          );
        } else {
          sendMessage(
            "brunispet",
            "No hay un código configurado. Usa !codigo [token] para establecer uno."
          );
        }
        return;
      }
      if (tags.username !== "brunispet" && !tags.mod) {
        return; // Ignorar comandos si el usuario no es "brunispet" y no es un moderador
      }

      switch (command) {
        case "!start":
          startTimer();
          break;
        case "!pause":
          pauseTimer();
          break;
        case "!min":
          if (args[1] && !isNaN(args[1])) {
            setMinutes(parseInt(args[1]));
          }
          break;
        case "!pomo":
          if (args[1] && !isNaN(args[1])) {
            setPomodoros(parseInt(args[1]));
          }
          break;
        case "!pomot":
          if (args[1] && !isNaN(args[1])) {
            setTotalPomodorosCount(parseInt(args[1]));
          }
          break;
        case "!mode":
          // Usar una función de actualización para obtener el estado más reciente
          setMode(prevMode => {
            const updatedMode = prevMode === "auto" ? "manual" : "auto";
            console.log(`🔁 Cambiando modo de ${prevMode} a: ${updatedMode.toUpperCase()}`);
            
            // Actualizar la referencia para acceso inmediato
            modeRef.current = updatedMode;
            
            // Limpiar cualquier intervalo existente
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            // Aplicar efecto según el nuevo modo
            if (updatedMode === "manual") {
              // Detener el temporizador
              isRunningRef.current = false;
              setIsRunning(false);
              
              // Notificar al chat
              if (Client.current) {
                Client.current.say(
                  channel,
                  `/me 🧭 Cambiado a modo MANUAL. Usa !start para reanudar cuando quieras.`
                );
              }
            } else {
              // Modo automático - iniciar el temporizador
              isRunningRef.current = true;
              setIsRunning(true);
              
              // Configurar un nuevo intervalo para el modo automático
              const tick = () => {
                setTimeLeft(prevTime => {
                  if (prevTime <= 1) {
                    handlePhaseSwitch();
                    return 0;
                  }
                  return prevTime - 1;
                });
              };
              
              timerRef.current = setInterval(tick, 1000);
              
              // Notificar al chat
              if (Client.current) {
                Client.current.say(
                  channel,
                  `/me ⚙️ Cambiado a modo AUTOMÁTICO. El temporizador continuará automáticamente.`
                );
              }
            }
            
            return updatedMode;
          });
          break;

          // Aplicar efecto según el nuevo modo
          if (newMode === "manual") {
            // Detener el temporizador
            isRunningRef.current = false;
            setIsRunning(false);
            
            // Notificar al chat
            if (Client.current) {
              Client.current.say(
                channel,
                `/me 🧭 Cambiado a modo MANUAL. Usa !start para reanudar cuando quieras.`
              );
            }
          } else {
            // Modo automático - iniciar el temporizador
            isRunningRef.current = true;
            setIsRunning(true);
            
            // Configurar un nuevo intervalo para el modo automático
            const tick = () => {
              setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                  handlePhaseSwitch();
                  return 0;
                }
                return prevTime - 1;
              });
            };
            
            timerRef.current = setInterval(tick, 1000);
            
            // Notificar al chat
            if (Client.current) {
              Client.current.say(
                channel,
                `/me ⚙️ Cambiado a modo AUTOMÁTICO. El temporizador continuará automáticamente.`
              );
            }
          }
          break;
        case "!reset":
          setPhase("💻PRODUCTIVO📋");
          break;
        case "!aviso":
          const message = args.slice(1).join(" ");
          console.log("Aviso actualizado:", message);
          setAviso(message);
          break;
        case "!codigo":
          const token = args.slice(1).join(" ");
          if (!token) {
            sendMessage(
              "brunispet",
              "❌ Debes proporcionar un token válido. Ejemplo: !codigo [token]"
            );
            return;
          }
          qrValueRef.current = token;
          setQrValue(token);
          break;
        default:
          break;
      }
    });
  }, []); // Este useEffect solo se ejecuta una vez al principio

  return (
    <div className="container">
      <div className="element_1">
        <Qrcode token={qrValue} />
      </div>
      <div className="element_2">
        <News message={aviso} />
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
