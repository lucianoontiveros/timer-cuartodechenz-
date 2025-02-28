import { useEffect } from "react";
import Timer from "./components/Timer";
import { twitch_controller } from "./controller/Twitch_controller";
import { setupModeration } from "./controller/moderator_controller";

const App = () => {
  useEffect(() => {
    const client = twitch_controller();
    const cleanup = setupModeration(client);

    return () => {
      if (cleanup) cleanup();
      if (client) client.disconnect();
    };
  }, []); // solo se ejecuta una vez al montarse

  return <Timer />;
};

export default App;
