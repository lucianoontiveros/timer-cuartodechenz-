export const setupModeration = (Twitch_client, setMinutes) => {
  if (!Twitch_client || !Twitch_client.on) return;

  const messageHandler = (channel, tags, message, self) => {
    const args = message.slice(1).split(" ");
    const command = args.shift().toLowerCase();
    const username = tags.username;
    const mod = tags?.mod;
    const num = parseInt(args);

    console.log(`Argumento: ${args}
    comando: ${command}
    username: ${username}
    mod: ${mod}
    num: ${num}`);

    switch (command) {
      case "start":
      case "init":
      case "play":
        if (!isNaN(num)) {
          setMinutes(num);
        }
        break;
    }
  };

  Twitch_client.on("message", messageHandler);

  return () => {
    Twitch_client.removeListener("message", messageHandler);
  };
};
