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
  setProductiveTime,
}) => {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);
  const [currentPhase, setCurrentPhase] = useState("initial");

  useEffect(() => {
    if (!pauseTime) {
      startTimer();
    }
  }, [pauseTime]);

  const startTimer = () => {
    if (currentPhase === "initial") {
      setMinutes(5);
      setProductiveTime(false);
      setCurrentPhase("productive");
    } else if (currentPhase === "productive") {
      setMinutes(60);
      setProductiveTime(true);
      setCurrentPhase("break");
    } else if (currentPhase === "break") {
      setMinutes(10);
      setProductiveTime(false);
      setPomo((prevPomo) =>
        prevPomo + 1 >= totalPomos ? prevPomo : prevPomo + 1
      );
      if (pomo >= totalPomos) return;
      setCurrentPhase("productive");
    }
  };

  useEffect(() => {
    setTimeLeft(minutes * 60);
  }, [minutes]);

  useEffect(() => {
    if (timeLeft <= 0 || pauseTime) return;

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
    }, 100);

    return () => clearInterval(interval);
  }, [timeLeft, pauseTime]);

  return <div>Tiempo restante: {formatTime(timeLeft)}</div>;
};

export default Timer;
