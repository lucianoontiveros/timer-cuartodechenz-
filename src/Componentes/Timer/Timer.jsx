import { useState, useEffect } from "react";

const Timer = ({ minutes }) => {
  // Convertimos los minutos a segundos
  const [timeLeft, setTimeLeft] = useState(minutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) return; // Detener si el tiempo llegó a cero

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer); // Limpiar el intervalo al desmontar
  }, [timeLeft]);

  // Formateamos el tiempo en minutos y segundos
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <h2>Tiempo restante: {formatTime(timeLeft)}</h2>
    </div>
  );
};

export default Timer;
