import React, { useState, useEffect, memo } from 'react';
import { formatTime } from './utils/formatTime';

const DURATIONS = {
  INICIANDO: 10 * 60,
  PRODUCTIVO: 90 * 60,
  DESCANSO: 15 * 60,
  TERMINADO: 0,
};

const StreamingApp = memo(() => {
  const [timeLeft, setTimeLeft] = useState(DURATIONS.INICIANDO);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState("INICIANDO");

  // Timer optimizado para streaming
  useEffect(() => {
    let interval = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            setIsRunning(false);
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const startTimer = () => {
    setTimeLeft(DURATIONS.PRODUCTIVO);
    setPhase("💻PRODUCTIVO📋");
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setTimeLeft(DURATIONS.INICIANDO);
    setPhase("INICIANDO");
    setIsRunning(false);
  };

  return (
    <div className="streaming-container">
      <div className="timer-display">
        <h1>{formatTime(timeLeft)}</h1>
        <h2>{phase}</h2>
      </div>
      
      <div className="streaming-controls">
        <button onClick={startTimer} disabled={isRunning}>
          Start
        </button>
        <button onClick={pauseTimer} disabled={!isRunning}>
          Pause
        </button>
        <button onClick={resetTimer}>
          Reset
        </button>
      </div>
    </div>
  );
});

export default StreamingApp;
