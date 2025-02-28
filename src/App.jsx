import { useEffect, useState } from "react";
import Timer from "./components/Timer";
import { twitch_controller } from "./Controller/Twitch_controller";
import { setupModeration } from "./controller/moderator_controller";

const App = () => {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const client = twitch_controller();
    const cleanup = setupModeration(client, setMinutes);
    console.log("Estoy en timer App");

    return () => {
      if (cleanup) cleanup();
      if (client) client.disconnect();
    };
  }, []); // solo se ejecuta una vez al montarse

  return <Timer minutes={minutes} />;
};

export default App;
