import React, { useEffect, useState } from "react";
import { formatTime } from "./utils/formatTime";

const Timer = ({
  minutes,
  setMinutes,
  pomo,
  setPomo,
  totalPomos,
  autoExecuted,
  pauseTime,
  setPauseTime,
  productiveTime,
  setProductiveTime,
}) => {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);
  const [currentPhase, setCurrentPhase] = useState("initial");
  const [timeLabel, setTimeLabel] = useState("Iniciando");

  useEffect(() => {
    setTimeLeft(minutes * 60);
  }, [minutes]);

  useEffect(() => {
    if (!pauseTime && pomo <= totalPomos) {
      startTimer();
    }
  }, [pauseTime]);

  useEffect(() => {
    if (productiveTime) {
      const endTimer = pomo + 1;
      if (totalPomos < endTimer) {
        setTimeLabel("Hemos terminado");
        setMinutes(0);
        setPauseTime(true);
        setCurrentPhase("Iniciando");
        return;
      }
      setPomo((prevPomo) => {
        const newPomo = prevPomo + 1;
        console.log(newPomo);
        return newPomo;
      });
    }
  }, [productiveTime]);

  useEffect(() => {
    if (timeLeft <= 0 || pauseTime || pomo > totalPomos) return;

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          if (autoExecuted) {
            startTimer();
          } else {
            setPauseTime(true);
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 100); // Intervalo real de 1 segundo

    return () => clearInterval(interval);
  }, [timeLeft, pauseTime, pomo]);

  const startTimer = () => {
    if (pomo > totalPomos) {
      setTimeLabel("Hemos terminado");
      return;
    }

    switch (currentPhase) {
      case "initial":
        setMinutes(2);
        setCurrentPhase("productive");
        setTimeLabel("Estamos iniciando");
        console.log("Iniciando");
        break;

      case "productive":
        setMinutes(3);
        setCurrentPhase("break");
        setTimeLabel("Tiempo productivo");
        setProductiveTime(true);
        console.log("productive");
        break;

      case "break":
        setMinutes(2);
        setCurrentPhase("productive");
        setTimeLabel("Tiempo de descanso");
        setProductiveTime(false);
        console.log("break");

        break;

      default:
        break;
    }
  };

  return (
    <>
      <div>Tiempo restante: {formatTime(timeLeft)}</div>
      <div>{timeLabel}</div>
      <div>Pomo {pomo}</div>
      <div>Total Pomos {totalPomos}</div>
    </>
  );
};

export default Timer;
