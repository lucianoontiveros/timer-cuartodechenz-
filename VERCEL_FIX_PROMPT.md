# 🚀 Prompt para Solucionar Errores de Vercel (Forbidden, CORS, Runtime)

## 📋 Instrucciones de Uso
Copia y pega este prompt completo cuando tengas errores de despliegue en Vercel con tu proyecto.

---

## 🔍 **PROBLEMA A RESOLVER**

Tengo un proyecto que está fallando al desplegar en Vercel con los siguientes síntomas:
- Errores "Forbidden" o 403 en producción
- Errores CORS en llamadas a APIs externas
- Errores de runtime o versión de Node.js
- El proyecto funciona localmente pero falla en Vercel

Por favor, realiza un análisis integral del proyecto y aplica las soluciones necesarias siguiendo estos pasos:

## 🎯 **PLAN DE ACCIÓN**

### **Paso 1: Análisis de Configuración**
1. **Analizar estructura del proyecto**:
   - Revisar `package.json` para dependencias y versión de Node.js
   - Verificar si existe `vercel.json` o archivos de configuración de Vercel
   - Identificar archivos de configuración (vite.config.js, next.config.js, etc.)

2. **Requisitos de Vercel 2025**:
   - Verificar que Node.js sea 20.x o superior (Node.js 18 fue deprecado)
   - Confirmar formato correcto de runtime en `vercel.json`

### **Paso 2: Soluciones Inmediatas**

#### **A. Configurar Node.js en package.json**
```json
{
  "engines": {
    "node": "20.x"
  }
}
```

#### **B. Crear/Actualizar vercel.json**
```json
{
  "version": 2,
  "functions": {
    "src/**/*.js": {
      "runtime": "vercel/node@20.x"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, User-Agent, Accept, Accept-Encoding"
        }
      ]
    }
  ]
}
```

#### **C. Mejorar Headers en Fetch Requests**
Para cualquier llamada a APIs externas, agregar headers completos:
```javascript
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MyApp/1.0.0',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
  },
  body: JSON.stringify(payload)
});
```

#### **D. Configurar Proxy (si usa Vite)**
```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api/twitch': {
        target: 'https://api.twitch.tv',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/twitch/, ''),
        secure: true,
      }
    }
  }
});
```

### **Paso 3: Problemas Específicos Comunes**

#### **Si usas tmi.js (Twitch API)**
```javascript
// Desactivar emoticones para evitar CORS
const opts = {
  options: { 
    debug: true,
    updateEmotesetsTimer: 0, // Desactivar carga de emoticones
  },
  // ... resto de configuración
};
```

#### **Si usas Discord Webhooks**
Verificar que el webhook URL esté configurado en variables de entorno de Vercel Dashboard.

#### **Si usas otras APIs externas**
- Configurar CORS headers en el servidor de destino
- Usar proxy para desarrollo local
- Verificar variables de entorno en producción

### **Paso 4: Verificación Final**
1. **Revisar variables de entorno** en Vercel Dashboard
2. **Testear localmente** con `npm run dev`
3. **Hacer commit y push** de los cambios
4. **Verificar despliegue** en Vercel

## 🔧 **CHECKLIST DE VERIFICACIÓN**

- [ ] `package.json` tiene `"engines": { "node": "20.x" }`
- [ ] `vercel.json` existe con formato correcto
- [ ] Headers completos en todas las llamadas fetch
- [ ] Variables de entorno configuradas en Vercel Dashboard
- [ ] Proxy configurado si es necesario
- [ ] Emoticones de Twitch desactivados si usa tmi.js
- [ ] Todos los cambios subidos al repositorio

## 🚨 **ERRORES COMUNES Y SOLUCIONES**

### Error: "Function Runtimes must have a valid version"
**Solución**: Usar `"runtime": "vercel/node@20.x"` en lugar de `"runtime": "nodejs20.x"`

### Error: CORS bloqueado desde localhost
**Solución**: Configurar proxy en vite.config.js o usar headers CORS

### Error: 403 Forbidden en producción
**Solución**: Agregar headers completos (User-Agent, Accept, etc.)

### Error: Variables de entorno no encontradas
**Solución**: Configurar en Vercel Dashboard → Settings → Environment Variables

## 📝 **COMANDOS ÚTILES**

```bash
# Verificar versión de Node.js
node --version

# Instalar dependencias
npm install

# Build local
npm run build

# Verificar variables de entorno
echo $VARIABLE_NAME
```

---

## 🎯 **RESULTADO ESPERADO**

Al finalizar este proceso, tu proyecto debería:
- ✅ Desplegarse exitosamente en Vercel
- ✅ No tener errores CORS
- ✅ Funcionar correctamente en producción
- ✅ Tener configuración óptima para Vercel 2025

## 📚 **REFERENCIAS**

- [Vercel Node.js Versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Vercel CORS Configuration](https://vercel.com/docs/concepts/projects/edge-network/headers)
- [Twitch API Migration Guide](https://dev.twitch.tv/docs/api/migration)

---

**Nota**: Adapta este prompt según las tecnologías específicas de tu proyecto (Next.js, React, Vite, etc.).
