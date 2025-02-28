import { useEffect, useState } from "react";
import Timer from "./components/Timer";
import { twitch_controller } from "./controller/Twitch_controller";
import { setupModeration } from "./controller/moderator_controller";

const App = () => {
  const [twitch_client, setTwitch_client] = useState(null);

  useEffect(() => {
    const client = twitch_controller();
    setTwitch_client(client);

    const cleanup = setupModeration(client);

    return () => {
      if (cleanup) {
        cleanup();
      }
      if (client) {
        client.disconnect();
      }
    };
  }, []);

  return (
    <>
      <Timer twitch_client={twitch_client} />
    </>
  );
};

export default App;
