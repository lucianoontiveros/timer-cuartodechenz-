import React, { useState, useEffect, useRef } from "react";
import { twitch_controller } from "./controller/Twitch_controller";
import { enviarMensaje } from './controller/controller_mensajes';
import "./index.css";
import { formatTime } from './components/utils/formatTime';
import News from './components/News';
import Qrcode from './components/Qrcode';
import campana from './components/utils/campana.mp3';

const App = () => {
    const [timeLeft, setTimeLeft] = useState(10 * 60); // Inicialmente 10 minutos (fase de Estamos trabajando /estudiando)
    const [isRunning, setIsRunning] = useState(false); // Para controlar si el temporizador está en marcha
    const [phase, setPhase] = useState("INICIANDO"); // Fase actual (INICIANDO, Estamos trabajando /estudiando, 🍵En descanso🍙, Final de los )
    const [pomodorosCompleted, setPomodorosCompleted] = useState(1); // Contador de pomodoros completados
    const [totalPomodoros, setTotalPomodoros] = useState(4); // Total de pomodoros que se desean completar
    const [mode, setMode] = useState("auto"); // Modo actual: "auto" o "manual"
    const [backgroundImage, setBackgroundImage] = useState("descanso");
    const [aviso, setAviso] = useState('');
    const [qrValue, setQrValue] = useState('');
    const qrValueRef = useRef(''); // Usamos useRef para almacenar el código QR
    const Client = useRef(null);
    const audio = new Audio(campana);


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
        return () => {   clearInterval(timer); } // Limpiar el temporizador al desmontar el componente
    }, [isRunning, phase]); // Se ejecuta cada vez que el estado `isRunning` o `phase` cambian

    // Cambiar de fase y manejar las transiciones
    const handlePhaseSwitch = () => {
        verifyMode();
        switch (phase) {
            case "INICIANDO":
                audio.play();
                setPhase("💻PRODUCTIVO📋");
                setTimeLeft(10 * 60); // Fase de Estamos trabajando /estudiando dura 2 minutos
                setBackgroundImage("productivo");
                break;

            case "💻PRODUCTIVO📋":
                audio.play();
                setPomodorosCompleted((prev) => {
                    const newCount = prev + 1;
                        setPhase("🍵DESCANSO🍙");
                    setTimeLeft(60 * 60); // Fase de 🍵En descanso🍙 dura 1 minuto
                    setBackgroundImage("descanso");
                    if (newCount > totalPomodoros) {
                        setPhase("🌳HEMOS TERMINADO🌳");
                        enviarMensaje("🌳HEMOS TERMINADO🌳", pomodorosCompleted, sendMessage);
                        setIsRunning(false);
                        return prev;
                    }
                    return newCount;
                });
                break;

            case "🍵DESCANSO🍙":
                audio.play();
                setPhase("💻PRODUCTIVO📋");
                setTimeLeft(10 * 60);
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

    const sendMessage = (channel, message) => Client.current.say(channel, `/me ${message}`);
    

    // Controlador de Twitch
    useEffect(() => {
        Client.current = twitch_controller();
        Client.current.on("message", (channel, tags, message, self) => {

            if (self) return; // Ignorar mensajes del propio bot
            const args = message.split(" ");
            const command = args[0].toLowerCase();
            if (command === "!sala") {
                if (qrValueRef.current) {
                    sendMessage("brunispet", `🌳CÓDIGO: ${qrValueRef.current.toUpperCase()} - Únete a la sala: https://www.forestapp.cc/join-room?token=${qrValueRef.current} Por favor desactiva la opción concentración profunda. Si no sabes como hacerlo, te ensañamos. De lo contrario puedes pedirnos una salita con esa funcionalidad activa`);
                } else {
                    sendMessage("brunispet", "No hay un código configurado. Usa !codigo [token] para establecer uno.");
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
                    // Cambiar el modo, pero no interrumpir el temporizador actual
                    setMode((prevMode) => {
                        const newMode = prevMode === "auto" ? "manual" : "auto";
                        console.log(`Modo cambiado a: ${newMode}`); // Verificar si realmente cambia el modo
                        return newMode;
                    });
                    break;
                case "!reset":
                    setPhase("💻PRODUCTIVO📋");
                    break;
                case "!aviso":
                    const message = args.slice(1).join(' ');
                    console.log('Aviso actualizado:', message);
                    setAviso(message);
                    break;
                case "!codigo":
                    const token = args.slice(1).join(' ');
                    qrValueRef.current = token;
                    setQrValue(token);
                    break;
                default:
                    break;
            }
        });
    }, []); // Este useEffect solo se ejecuta una vez al principio

    return (
        <div>
            <Qrcode token={qrValue} />
            <News message={aviso} />
            <div className={`consola ${backgroundImage}`}>
                <div className="div1"> </div>
                <div className="div2"></div>
                <div className="div3"><h1>{formatTime(timeLeft)}</h1></div>
                <div className="div4"><p className="blink">{`>`}</p><h5>{phase}</h5></div>
                <div className="div5"><h2>{mode}</h2></div>
                <div className="div6"><h4>{pomodorosCompleted}/{totalPomodoros}</h4></div>
                <div className="div7"> </div>
           
            </div>
        </div>
    );
};

export default App;
