import React, { useEffect, useState } from "react";
import { formatTime } from "./utils/formatTime";

const Timer = ({ minutes }) => {
  const [timeLeft, setTimeLeft] = useState(minutes * 60); // Inicializa con el valor pasado
  const [pomo, setPomo] = useState(0);

  const max_pomo = () => setPomo((prevPomo) => prevPomo + 1);

  // Resetea y reinicia el temporizador cuando 'minutes' cambia
  useEffect(() => {
    setTimeLeft(minutes * 60); // Resetea el temporizador cuando cambian los minutos
  }, [minutes]);

  // Manejo del temporizador: inicia solo si timeLeft > 0
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          max_pomo(); // Detener el intervalo al llegar a 0
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // Limpiar intervalo cuando se detenga o se reinicie
  }, [timeLeft]); // Solo se activa cuando timeLeft cambia

  console.log(`Este es el pomo actual: ${pomo}`);

  return <div>Tiempo restante: {formatTime(timeLeft)}</div>;
};

export default Timer;
