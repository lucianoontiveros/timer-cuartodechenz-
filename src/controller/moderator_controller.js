export const setupModeration = (Twitch_client) => {
  if (!Twitch_client) return;

  const messageHandler = (channel, tags, message, self) => {
    if (self) return;
    if (message.toLowerCase() === "!hello") {
      Twitch_client.say(channel, `@${tags.username}, heya!`);
    }
  };

  Twitch_client.on("message", messageHandler);

  return () => {
    Twitch_client.removeListener("message", messageHandler);
  };
};
