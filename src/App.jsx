import React, { useState, useEffect } from "react";
import { twitch_controller } from "./Controller/Twitch_controller";
import "./index.css";
import { formatTime } from './components/utils/formatTime';
import News from './components/News';
import Qrcode from './components/Qrcode';

const App = () => {
    const [timeLeft, setTimeLeft] = useState(1 * 60); // Inicialmente 2 minutos (fase de Estamos trabajando /estudiando)
    const [isRunning, setIsRunning] = useState(false); // Para controlar si el temporizador está en marcha
    const [phase, setPhase] = useState("INICIANDO"); // Fase actual (INICIANDO, Estamos trabajando /estudiando, 🍵En descanso🍙, Final de los )
    const [pomodorosCompleted, setPomodorosCompleted] = useState(1); // Contador de pomodoros completados
    const [totalPomodoros, setTotalPomodoros] = useState(4); // Total de pomodoros que se desean completar
    const [mode, setMode] = useState("auto"); // Modo actual: "auto" o "manual"
    const [backgroundImage, setBackgroundImage] = useState("descanso");
    const [aviso, setAviso] = useState('');
    const [qrValue, setQrValue] = useState('');

    // Lógica del temporizador
    useEffect(() => {
        if (!isRunning) return; // Si el temporizador no está corriendo, no hacer nada

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handlePhaseSwitch();
                    return 0;
                }
                return prev - 1;
            });
        }, 100);

        return () => clearInterval(timer); // Limpiar el temporizador al desmontar el componente
    }, [isRunning, phase]); // Se ejecuta cada vez que el estado `isRunning` o `phase` cambian

    // Cambiar de fase y manejar las transiciones
    const handlePhaseSwitch = () => {
        verifyMode();
        switch (phase) {
            case "INICIANDO":
                setPhase("💻PRODUCTIVO📋");
                setTimeLeft(2 * 60); // Fase de Estamos trabajando /estudiando dura 2 minutos
                setBackgroundImage("productivo");
                break;

            case "💻PRODUCTIVO📋":
                setPomodorosCompleted((prev) => {
                    const newCount = prev + 1;
                    setPhase("🍵DESCANSO🍙");
                    setTimeLeft(1 * 60); // Fase de 🍵En descanso🍙 dura 1 minuto
                    setBackgroundImage("descanso");
                    if (newCount > totalPomodoros) {
                        setPhase("🌳HEMOS TERMINADO🌳");
                        setIsRunning(false);
                        return prev;
                    }
                    return newCount;
                });
                break;

            case "🍵DESCANSO🍙":
                setPhase("💻PRODUCTIVO📋");
                setTimeLeft(2 * 60);
                setBackgroundImage("productivo");
                break;

            case "🌳HEMOS TERMINADO🌳":
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

    // Controlador de Twitch
    useEffect(() => {
        const Client = twitch_controller();

        Client.on("message", (channel, tags, message, self) => {
            if (self) return; // Ignorar mensajes del propio bot

            const args = message.split(" ");
            const command = args[0].toLowerCase();

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
