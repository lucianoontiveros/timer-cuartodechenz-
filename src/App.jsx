import React, { useState, useEffect, useRef } from "react";
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

  class FirstActivity {
    constructor(username, estado) {
      this.username = username;
      this.estado = estado;
    }
  }
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

  // Lógica del temporizador
  useEffect(() => {
    if (!isRunning) return; // Si el temporizador no está corriendo, no hacer nada
    enviarMensaje(phase, pomodorosCompleted, sendMessage);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handlePhaseSwitch();

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
    }; // Limpiar el temporizador al desmontar el componente
  }, [isRunning, phase]); // Se ejecuta cada vez que el estado `isRunning` o `phase` cambian

  // Cambiar de fase y manejar las transiciones
  const handlePhaseSwitch = () => {
    verifyMode();
    switch (phase) {
      case "INICIANDO":
        audio.play();
        setPhase("💻PRODUCTIVO📋");
        setTimeLeft(60 * 60); // Fase de Estamos trabajando /estudiando dura 2 minutos
        setBackgroundImage("productivo");
        break;

      case "💻PRODUCTIVO📋":
        audio.play();
        setPomodorosCompleted((prev) => {
          const newCount = prev + 1;
          setPhase("🍵DESCANSO🍙");
          setTimeLeft(10 * 60); // Fase de 🍵En descanso🍙 dura 1 minuto
          setBackgroundImage("descanso");
          if (newCount > totalPomodoros) {
            setPhase("🌳HEMOS TERMINADO🌳");
            setTimeLeft(10 * 60);
            enviarMensaje(
              "🌳SE VIENE RAID🌳",
              pomodorosCompleted,
              sendMessage
            );
            return prev;
          }
          return newCount;
        });
        break;

      case "🍵DESCANSO🍙":
        audio.play();
        setPhase("💻PRODUCTIVO📋");
        setTimeLeft(60 * 60);
        setBackgroundImage("productivo");
        break;

      case "🌳HEMOS TERMINADO🌳":
        audio.play();
        setIsRunning(false);
        setTimeLeft(0); // Fase de Estamos trabajando /estudiando dura 2 minutos
        setBackgroundImage("descanso");
        break;
    }
  };

  const verifyMode = () => {
    // Si estamos en modo automático, continuamos con la siguiente fase
    if (mode === "auto") {
      setIsRunning(true); // Reanudar el temporizador automáticamente
    } else {
      setIsRunning(false); // En modo manual, pausamos el temporizador
    }
  };

  // Iniciar el temporizador
  const startTimer = () => {
    if (mode === "manual" && phase === "INICIANDO" && timeLeft > 0) {
      // Solo empezar en modo manual si el temporizador está pausado
      return setIsRunning(false);
    }

    if (mode === "manual" && phase === "🍵DESCANSO🍙" && timeLeft > 0) {
      // Solo empezar en modo manual si el temporizador está pausado
      return setIsRunning(false);
    }

    if (mode === "manual" && phase === "💻PRODUCTIVO📋" && timeLeft > 0) {
      // Solo empezar en modo manual si el temporizador está pausado
      setIsRunning(false);
    } else {
      setIsRunning(true); // En cualquier otro caso, iniciar el temporizador
    }
  };

  // Pausar el temporizador
  const pauseTimer = () => setIsRunning(false);

  // Ajustar minutos
  const setMinutes = (minutes) => {
    setTimeLeft(minutes * 60);
  };

  // Ajustar el número de pomodoros completados
  const setPomodoros = (count) => setPomodorosCompleted(count);

  // Ajustar el número total de pomodoros
  const setTotalPomodorosCount = (count) => setTotalPomodoros(count);

  const sendMessage = (channel, message) =>
    Client.current.say(channel, `/me ${message}`);

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

      const mensajeGeneral = `¡Qué alegría verte por aquí, ${username}! Espero que tengas una jornada productiva. 📚✨`;
      const mensajeSubs = isSub
        ? `👑 ¡Mil gracias por apoyar este canal! Gracias a ti, las croquetas para mí y los michis están aseguradas. 🐱💕`
        : `Espero que tengas una excelente sesión de estudio. ¡Mucho ánimo! 💪📖`;
      const mensajeMod = isMod
        ? `⚔️ ¡Nuestra comunidad está en buenas manos contigo como mod! Gracias por ayudar a que esto sea un espacio increíble. ✨`
        : "";
      const mensajeVid = isVip
        ? `💎 ¡Nos encanta verte por aquí! Tu presencia hace que estos días sean aún más especiales. 🌟`
        : "";
      const buscandoActividad = () =>
        usersActivities.find((items) => items.username === username);
      if (!buscandoActividad()) {
        let estado = "Acaba de ingresar al chat 📱";
        let firstActivity = new FirstActivity(username, estado);
        usersActivities.push(firstActivity);

        if (
          username !== "streamlabs" &&
          username !== "brunispet" &&
          username !== "cuartodechenz" &&
          username !== "botomizador" &&
          username !== "streamelements" &&
          username !== "nightbot" &&
          username !== "mohcitrus"
        ) {
          Client.current.say(
            channel,
            mensajeGeneral + mensajeSubs + mensajeMod + mensajeVid
          );
        }
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
            "cuartodechenz",
            `🌳CÓDIGO: ${qrValueRef.current.toUpperCase()} - Únete a la sala: https://forestapp.cc/join-room?token=${
              qrValueRef.current
            } Por favor desactiva la opción concentración profunda. Si no sabes como hacerlo, te ensañamos. De lo contrario puedes pedirnos una salita con esa funcionalidad activa`
          );
        } else {
          sendMessage(
            "cuartodechenz",
            "No hay un código configurado. Usa !codigo [token] para establecer uno."
          );
        }
        return;
      }
      if (tags.username !== "cuartodechenz" && !tags.mod) {
        return; // Ignorar comandos si el usuario no es "cuartodechenz" y no es un moderador
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
          setMode((prevMode) => {
            const newMode = prevMode === "auto" ? "manual" : "auto";
            console.log(`🔁 Modo cambiado a: ${newMode.toUpperCase()}`);

            // Aplicar efecto inmediato:
            if (newMode === "manual") {
              setIsRunning(false); // Detener en el acto si entra en manual
              Client.current.say(
                channel,
                `/me 🧭 Cambiado a modo MANUAL. Usa !start para reanudar cuando quieras.`
              );
            } else {
              setIsRunning(true); // Continuar en el acto si vuelve a automático
              Client.current.say(
                channel,
                `/me ⚙️ Cambiado a modo AUTOMÁTICO. El temporizador seguirá normalmente.`
              );
            }

            return newMode;
          });
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
              "cuartodechenz",
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
