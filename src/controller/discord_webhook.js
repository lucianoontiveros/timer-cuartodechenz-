/**
 * Controlador de Webhooks para Discord
 * Envía notificaciones automatizadas al servidor de Discord
 */

/**
 * Envía una notificación de sala de estudio a Discord
 * @param {string} qrCode - Código QR de la sala
 * @param {string} phase - Fase actual del temporizador
 * @param {number} duration - Duración en segundos
 * @param {string} username - Nombre de usuario que generó la sala
 * @param {number} pomodorosCompleted - Número de pomodoros completados (para color)
 * @returns {Promise<boolean>} - true si el envío fue exitoso, false si falló
 */
export const sendDiscordNotification = async (qrCode, phase, duration, username = null, pomodorosCompleted = 1) => {
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('Discord webhook URL no configurada');
    return false;
  }

  // Colores aleatorios para variedad
  const randomColors = [
    0x3498db,  // Azul
    0x2ecc71,  // Verde
    0xf39c12,  // Naranja
    0xe74c3c,  // Rojo
    0x9b59b6,  // Púrpura
    0x1abc9c,  // Turquesa
    0xe67e22,  // Naranja oscuro
    0x34495e,  // Azul oscuro
    0x16a085,  // Verde mar
    0x8e44ad,  // Violeta
    0xc0392b,  // Rojo oscuro
    0x27ae60   // Verde esmeralda
  ];

  // Seleccionar color aleatorio
  const colorIndex = Math.floor(Math.random() * randomColors.length);
  const color = randomColors[colorIndex];
  
  // La sala siempre tiene duración de 90 minutos (tiempo productivo)
  const durationText = "90min";

  const payload = {
    content: "¡Nueva sala de estudio disponible!",
    embeds: [{
      title: "Sala Pomodoro - Cuarto de Chenz",
      description: "Únete a nuestra sesión de estudio productiva",
      color: color,
      fields: [
        {
          name: "Código de Sala",
          value: `\`${qrCode.toUpperCase()}\``,
          inline: true
        },
        {
          name: "Duración",
          value: durationText,
          inline: true
        },
        {
          name: "Enlace Forest",
          value: `https://forestapp.cc/join-room?token=${qrCode}`,
          inline: false
        }
      ],
      footer: {
        text: username ? `Sala creada por ${username}` : "Timer Cuarto de Chenz"
      },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    console.log('Enviando notificación a Discord:', { qrCode, phase, duration, username, pomodorosCompleted });
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('Notificación de Discord enviada exitosamente');
      return true;
    } else {
      console.warn('Error al enviar notificación a Discord:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error enviando notificación a Discord:', error.message);
    return false;
  }
};
