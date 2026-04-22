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
 * @returns {Promise<boolean>} - true si el envío fue exitoso, false si falló
 */
export const sendDiscordNotification = async (qrCode, phase, duration, username = null) => {
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('Discord webhook URL no configurada');
    return false;
  }

  // Determinar color según la fase (manejar emojis)
  const phaseColors = {
    'INICIANDO': 0x3498db,           // Azul
    'PRODUCTIVO': 0x2ecc71,          // Verde
    'DESCANSO': 0xf39c12,            // Naranja
    'TERMINADO': 0xe74c3c             // Rojo
  };

  // Limpiar fase para obtener el nombre base (remover emojis y caracteres especiales)
  const cleanPhase = phase.replace(/[^\w]/g, '');
  const color = phaseColors[cleanPhase] || 0x3498db;
  
  // Formatear duración
  const durationMinutes = Math.floor(duration / 60);
  const durationText = durationMinutes > 60 
    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}min`
    : `${durationMinutes}min`;

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
          name: "Fase",
          value: phase,
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
    console.log('Enviando notificación a Discord:', { qrCode, phase, duration, username });
    
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

/**
 * Envía notificación de cambio de fase
 * @param {string} newPhase - Nueva fase del temporizador
 * @param {number} duration - Duración en segundos
 * @returns {Promise<boolean>}
 */
export const sendPhaseChangeNotification = async (newPhase, duration) => {
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) return false;

  const phaseEmojis = {
    'INICIANDO': 'INICIANDO',
    'PRODUCTIVO': 'PRODUCTIVO',
    'DESCANSO': 'DESCANSO',
    'TERMINADO': 'TERMINADO'
  };

  const phaseColors = {
    'INICIANDO': 0x3498db,
    'PRODUCTIVO': 0x2ecc71,
    'DESCANSO': 0xf39c12,
    'TERMINADO': 0xe74c3c
  };

  const durationMinutes = Math.floor(duration / 60);
  const durationText = durationMinutes > 60 
    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}min`
    : `${durationMinutes}min`;

  const payload = {
    embeds: [{
      title: "Cambio de Fase - Timer Pomodoro",
      description: `El temporizador ha cambiado a la fase: ${newPhase}`,
      color: phaseColors[newPhase] || 0x3498db,
      fields: [
        {
          name: "Fase Actual",
          value: phaseEmojis[newPhase] || newPhase,
          inline: true
        },
        {
          name: "Duración",
          value: durationText,
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error('Error enviando notificación de cambio de fase:', error);
    return false;
  }
};
