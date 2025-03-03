export const setupModeration = (
  Twitch_client,
  setMinutes,
  pomo,
  setPomo,
  totalPomos,
  setTotalPomos,
  setPauseTime,
  setAutoExecuted,
  setProductiveTime
) => {
  if (!Twitch_client || !Twitch_client.on) return;

  const messageHandler = (channel, tags, message, self) => {
    if (self) return;

    const args = message.slice(1).split(" ");
    const command = args.shift().toLowerCase();
    const num = parseInt(args);

    switch (command) {
      case "start":
        console.log("⏳ Iniciando temporizador");
        setPauseTime(false);
        break;
      case "min":
        if (!isNaN(num)) {
          setMinutes(num);
        }
        break;
      case "pomo":
        setPomo(num);
        break;
      case "pomot":
        setTotalPomos(num);
        break;
      case "pause":
        setPauseTime(true);
        break;
      case "auto":
        setAutoExecuted(true);
        break;
      case "manual":
        setAutoExecuted(false);
        break;
      default:
        console.log(`⚠️ Comando desconocido: ${command}`);
    }
  };

  Twitch_client.on("message", messageHandler);

  return () => {
    Twitch_client.removeListener("message", messageHandler);
  };
};
