/**
 * Controlador de Webhooks para Discord
 * Envía notificaciones automatizadas al servidor de Discord
 */

export const sendDiscordNotification = async (
  qrCode,
  phase,
  duration,
  username = null,
  pomodorosCompleted = 1
) => {
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("❌ Discord webhook URL no configurada");
    return false;
  }

  // Colores aleatorios para variedad
  const randomColors = [
    0x3498db,
    0x2ecc71,
    0xf39c12,
    0xe74c3c,
    0x9b59b6,
    0x1abc9c,
    0xe67e22,
    0x34495e,
    0x16a085,
    0x8e44ad,
    0xc0392b,
    0x27ae60,
  ];

  const color =
    randomColors[Math.floor(Math.random() * randomColors.length)];

  const payload = {
    content: "¡Nueva sala de estudio disponible!",
    embeds: [
      {
        title: "Sala Pomodoro - Cuarto de Chenz",
        description: "Únete a nuestra sesión de estudio productiva",
        color,
        fields: [
          {
            name: "Código de Sala",
            value: `\`${qrCode.toUpperCase()}\``,
            inline: true,
          },
          {
            name: "Duración",
            value: "90min",
            inline: true,
          },
          {
            name: "Enlace Forest",
            value: `https://forestapp.cc/join-room?token=${qrCode}`,
            inline: false,
          },
        ],
        footer: {
          text: username
            ? `Sala creada por ${username}`
            : "Timer Cuarto de Chenz",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    console.log("📤 Enviando a Discord...");
    console.log("Webhook:", webhookUrl);
    console.log("Payload:", payload);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Status:", response.status);
    console.log("OK:", response.ok);

    const text = await response.text();
    console.log("Respuesta Discord:", text);

    if (response.ok) {
      console.log("✅ Notificación enviada correctamente");
      return true;
    }

    console.warn("❌ Discord respondió con error");
    return false;
  } catch (error) {
    console.error("❌ Error completo:", error);
    return false;
  }
};