# OBJETIVO DEL PROYECTO
Este proyecto tiene como objetivo principal montar un timer cuenta regresiva para el canal de Twitch cuarto de chenz . A través de esta aplicación, buscamos poder gestionar desde el chat sus distintas funcionalidades. 

# DESCRIPCIÓN DE CADA ARCHIVO
- **App.jsx**: Este archivo contiene la lógica principal de la aplicación, gestionando el estado y las rutas.
- **Qrcode.jsx**: Componente encargado de generar y mostrar códigos QR.
- **qrcode.css**: Estilos específicos para el componente de código QR.
- **News.jsx**: Componente que muestra las últimas noticias relevantes.
- **news.css**: Estilos para el componente de noticias.

# MANERA DE FUNCIONAR
La aplicación funciona mediante comandos ingresado a través del chat. 

## Comandos

1. **!start**: Inicia el temporizador para la fase actual de trabajo o descanso.

2. **!pause**: Pausa el temporizador, deteniendo el conteo del tiempo restante.

3. **!min [minutos]**: Ajusta la cantidad de minutos en el temporizador.

4. **!pomo [cantidad]**: Ajusta el número de pomodoros completados.

5. **!pomot [cantidad]**: Ajusta el número total de pomodoros que se desean completar.

6. **!mode**: Cambia entre los modos "auto" y "manual" sin interrumpir el temporizador actual.

7. **!reset**: Reinicia la fase a "PRODUCTIVO".

8. **!aviso [mensaje]**: Actualiza el aviso mostrado en la aplicación.

9. **!codigo [token]**: Establece el valor del código QR basado en el token proporcionado.

## Funcionalidades

1. **Temporizador Pomodoro**: 
   - Permite establecer un temporizador para sesiones de trabajo y descansos.
   - Fases de trabajo: "INICIANDO", "PRODUCTIVO", "DESCANSO", y "TERMINADO".

2. **Contador de Pomodoros**: 
   - Lleva un registro de la cantidad de pomodoros completados y permite establecer un objetivo total.

3. **Modo de operación**: 
   - Soporta modos "auto" y "manual" para el control del temporizador.

4. **Notificaciones**: 
   - Envía mensajes de estado a los usuarios en diferentes fases del temporizador.

5. **Interfaz de usuario dinámica**: 
   - Muestra mensajes en tiempo real utilizando un efecto de escritura.

6. **Código QR**: 
   - Genera un código QR basado en un token proporcionado.

1. **Tecnología Utilizada**:
   - **React**: Una biblioteca de JavaScript para construir interfaces de usuario.
   - **Vite**: Un entorno de desarrollo que permite una configuración mínima para trabajar con React, ofreciendo características como Hot Module Replacement (HMR) para una experiencia de desarrollo más fluida.

2. **Plugins Disponibles**:
   - **@vitejs/plugin-react**: Este plugin utiliza Babel para habilitar la funcionalidad de Fast Refresh, lo que permite que los cambios en el código se reflejen instantáneamente en la aplicación sin perder el estado.
   - **@vitejs/plugin-react-swc**: Alternativa al plugin anterior, utiliza SWC para Fast Refresh, ofreciendo una opción más rápida para la transpilación del código.

### Funcionalidades

- **Configuración Mínima**: La aplicación está diseñada para ser fácil de configurar y comenzar a usar, lo que es ideal para desarrolladores que buscan un entorno ligero y eficiente.
- **Desarrollo Rápido**: Gracias a Vite y su soporte para HMR, los desarrolladores pueden ver los cambios en tiempo real, lo que acelera el proceso de desarrollo.
- **Soporte para ESLint**: Se incluyen algunas reglas de ESLint para ayudar a mantener la calidad del código.

# MODO DE EJECUCIÓN
Para ejecutar la aplicación, sigue estos pasos:
1. Clona el repositorio: `git clone [URL del repositorio]`
2. Navega al directorio del proyecto: `cd [nombre del directorio]`
3. Instala las dependencias: `npm install`
4. Inicia la aplicación: `npm start`

# CARACTERÍSTICAS PRINCIPALES
- [Característica 1]: [Descripción]
- [Característica 2]: [Descripción]
- [Característica 3]: [Descripción]

# VINCULACIÓN CON TWITCH
La aplicación se integra con Twitch para [explica cómo se vincula con Twitch y qué funcionalidades ofrece]. Esto permite a los usuarios [beneficios de la integración].

## Evaluación Integral de la Aplicación

### 1. Estructura del Código
- La organización de los archivos y carpetas sigue una estructura lógica y coherente.
- Los componentes están bien definidos y separados.

### 2. Calidad del Código
- El código es legible con nombres descriptivos para variables y funciones.
- Se incluyen comentarios adecuados que explican la lógica compleja.

### 3. Funcionalidad
- Todas las características de la aplicación funcionan como se espera.
- La gestión de errores es adecuada y maneja las excepciones correctamente.

### 4. Rendimiento
- Se ha evaluado el rendimiento de la aplicación y se han identificado áreas para optimizar.

### 5. Estilo y Consistencia
- El estilo de codificación es consistente en toda la base de código.
- Se utilizan herramientas de linting para detectar problemas de estilo.

### 6. Pruebas
- Se han implementado pruebas unitarias y de integración adecuadas.
- La cobertura de las pruebas es evaluada y se considera agregar más pruebas si es necesario.

### 7. Experiencia del Usuario (UX)
- La interfaz de usuario es atractiva.
- Se recomienda realizar pruebas de usabilidad con usuarios reales.
