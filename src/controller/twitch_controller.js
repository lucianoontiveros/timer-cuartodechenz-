import tmi from "tmi.js";

export const twitch_controller = () => {
  const { VITE_APP_USERNAME, VITE_APP_PASSWORD, VITE_APP_CHANNELS } =
    import.meta.env;

  const opts = {
    options: { debug: false },
    identity: {
      username: VITE_APP_USERNAME,
      password: VITE_APP_PASSWORD,
    },
    channels: [VITE_APP_CHANNELS],
  };

  const new_client_twitch = new tmi.Client(opts);
  new_client_twitch.connect().catch(console.error);

  return new_client_twitch;
};
