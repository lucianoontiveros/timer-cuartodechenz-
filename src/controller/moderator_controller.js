export const setupModeration = (Twitch_client) => {
  if (!Twitch_client) return; // Si no hay cliente, salir

  // Función para manejar los mensajes del chat
  const messageHandler = (channel, tags, message, self) => {
    if (self) return; // Ignorar mensajes del propio bot

    if (message.toLowerCase() === "!hello") {
      Twitch_client.say(channel, `@${tags.username}, heya!`);
    }
  };

  Twitch_client.on("message", messageHandler); // ✅ Escuchar mensajes

  return () => {
    Twitch_client.removeListener("message", messageHandler); // ✅ Limpiar evento al desmontar
  };
};
