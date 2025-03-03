import { useEffect, useState } from "react";
import Timer from "./components/Timer";
import { twitch_controller } from "./Controller/Twitch_controller";
import { setupModeration } from "./controller/moderator_controller";

const App = () => {
  const [minutes, setMinutes] = useState(0);
  const [pomo, setPomo] = useState(0);
  const [autoExecuted, setAutoExecuted] = useState(true);
  const [pauseTime, setPauseTime] = useState(true);
  const [totalPomos, setTotalPomos] = useState(13);
  const [productiveTime, setProductiveTime] = useState(false);

  useEffect(() => {
    const client = twitch_controller();
    const cleanup = setupModeration(
      client,
      setMinutes,
      pomo,
      setPomo,
      totalPomos,
      setTotalPomos,
      setPauseTime,
      setAutoExecuted,
      setProductiveTime
    );

    return () => {
      if (cleanup) cleanup();
      if (client) client.disconnect();
    };
  }, []);

  return (
    <Timer
      minutes={minutes}
      setMinutes={setMinutes}
      pomo={pomo}
      setPomo={setPomo}
      totalPomos={totalPomos}
      autoExecuted={autoExecuted}
      pauseTime={pauseTime}
      setPauseTime={setPauseTime}
      setProductiveTime={setProductiveTime}
    />
  );
};

export default App;
