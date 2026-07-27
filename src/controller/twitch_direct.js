// Conexión directa a Twitch via WebSocket para evitar errores CORS
export const twitch_controller_direct = () => {
  const { VITE_APP_USERNAME, VITE_APP_PASSWORD, VITE_APP_CHANNELS } = import.meta.env;
  
  if (!VITE_APP_USERNAME || !VITE_APP_PASSWORD || !VITE_APP_CHANNELS) {
    console.error('Faltan variables de entorno de Twitch');
    return null;
  }

  // Conexión WebSocket directa a Twitch IRC
  const ws = new WebSocket(`wss://irc-ws.chat.twitch.tv:443`);
  
  const client = {
    connected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    
    connect() {
      return new Promise((resolve, reject) => {
        ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          
          // Autenticación OAuth
          ws.send('CAP REQ :twitch.tv/tags :twitch.tv/commands');
          ws.send(`PASS ${VITE_APP_PASSWORD}`);
          ws.send(`NICK ${VITE_APP_USERNAME}`);
          ws.send(`JOIN ${VITE_APP_CHANNELS}`);
          
          console.log('Conectado a Twitch directamente (sin CORS)');
          resolve(this);
        };
        
        ws.onerror = (error) => {
          console.error('Error de conexión WebSocket:', error);
          reject(error);
        };
        
        ws.onclose = () => {
          this.connected = false;
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`Reconectando... intento ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.connect(), 2000);
          }
        };
        
        ws.connect();
      });
    },
    
    say(channel, message) {
      if (this.connected) {
        ws.send(`PRIVMSG ${channel} :${message}`);
      }
    },
    
    disconnect() {
      if (ws) {
        ws.close();
      }
      this.connected = false;
    },
    
    // Escuchar mensajes del chat
    onMessage(callback) {
      ws.onmessage = (event) => {
        try {
          const data = event.data;
          
          // Parsear mensajes IRC manualmente
          if (data.startsWith('PING')) {
            ws.send('PONG :tmi.twitch.tv');
            return;
          }
          
          // Extraer información del mensaje
          const parsed = this.parseIRCMessage(data);
          if (parsed && parsed.type === 'PRIVMSG') {
            callback(parsed.channel, parsed.tags, parsed.message, parsed.self);
          }
        } catch (error) {
          console.error('Error parseando mensaje IRC:', error);
        }
      };
    },
    
    // Parseo básico de mensajes IRC
    parseIRCMessage(data) {
      try {
        // Formato: :tags!user@user.tmi.twitch.tv PRIVMSG #channel :message
        const match = data.match(/^:(.+)!.+@.+\.tmi\.tv\s+(PRIVMSG|WHISPER)\s+(#\S+|(\S+))\s+:(.*)$/);
        
        if (!match) return null;
        
        const [, tags, user, type, target, message] = match;
        
        // Parsear tags
        const tagPairs = tags.split(';');
        const tagObj = {};
        tagPairs.forEach(tag => {
          const [key, value] = tag.split('=');
          tagObj[key] = value;
        });
        
        return {
          type,
          channel: type === 'PRIVMSG' ? target : null,
          tags: tagObj,
          user: user.split('!')[0],
          message: message,
          self: user === VITE_APP_USERNAME
        };
      } catch (error) {
        return null;
      }
    }
  };
  
  client.connect();
  return client;
};
