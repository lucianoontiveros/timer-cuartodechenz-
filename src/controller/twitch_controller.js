import tmi from "tmi.js";

export const twitch_controller = () => {
  const opts = {
    options: { debug: false },
    identity: {
      username: import.meta.env.VITE_APP_USERNAME,
      password: import.meta.env.VITE_APP_PASSWORD,
    },
    channels: [import.meta.env.VITE_APP_CHANNELS],
  };

  const new_client_twitch = new tmi.Client(opts);
  new_client_twitch.connect().catch(console.error);

  return new_client_twitch;
};
