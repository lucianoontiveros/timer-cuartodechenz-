import tmi from "tmi.js";

export const twitch_controller = () => {
  const { VITE_APP_USERNAME, VITE_APP_PASSWORD, VITE_APP_CHANNELS } =
    import.meta.env;

  // Verificar que las variables de entorno estén configuradas
  if (!VITE_APP_USERNAME || !VITE_APP_PASSWORD || !VITE_APP_CHANNELS) {
    console.error('Error: Faltan variables de entorno de Twitch:');
    console.error('VITE_APP_USERNAME:', !!VITE_APP_USERNAME);
    console.error('VITE_APP_PASSWORD:', !!VITE_APP_PASSWORD);
    console.error('VITE_APP_CHANNELS:', !!VITE_APP_CHANNELS);
    console.error('Asegúrate de tener un archivo .env con estas variables configuradas');
    return null;
  }

  console.log('Configurando cliente de Twitch con:', {
    username: VITE_APP_USERNAME,
    channels: VITE_APP_CHANNELS,
    hasToken: !!VITE_APP_PASSWORD
  });

  const opts = {
    options: { debug: true, },
    identity: {
      username: VITE_APP_USERNAME,
      password: VITE_APP_PASSWORD,
    },
    channels: [VITE_APP_CHANNELS],
  };

  const new_client_twitch = new tmi.Client(opts);
  new_client_twitch.connect().then(() => {
    console.log('Conectado a Twitch correctamente');
  }).catch((error) => {
    console.error('Error al conectar a Twitch:', error);
  });

  return new_client_twitch;
};
