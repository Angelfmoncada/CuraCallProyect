# Pruebas E2E con Playwright

Este directorio contiene las pruebas End-to-End (E2E) para el sistema de chat con streaming SSE y funcionalidades de voz.

## 📋 Estructura de Pruebas

### 🗂️ Archivos de Pruebas

- **`chat-flow.spec.ts`** - Pruebas del flujo completo de chat
  - Carga de interfaz
  - Envío y recepción de mensajes
  - Streaming de respuestas
  - Historial de conversación
  - Manejo de estados de carga
  - Navegación por teclado

- **`voice-features.spec.ts`** - Pruebas de funcionalidades de voz
  - Speech-to-Text (STT)
  - Text-to-Speech (TTS)
  - Permisos de micrófono
  - Estados de grabación
  - Manejo de errores de voz
  - Accesibilidad de controles de voz

- **`error-handling.spec.ts`** - Pruebas de manejo de errores
  - Errores de conexión
  - Timeouts de red
  - Errores del servidor (500, 401, 429)
  - Abortar peticiones
  - Reintentos automáticos
  - Estado offline

- **`accessibility.spec.ts`** - Pruebas de accesibilidad
  - Navegación por teclado
  - Atributos ARIA
  - Contraste de colores
  - Screen readers
  - Zoom hasta 200%
  - Modo de alto contraste

### 🛠️ Archivos de Utilidades

- **`global-setup.ts`** - Configuración global de pruebas
- **`test-utils.ts`** - Utilidades comunes para pruebas
- **`README.md`** - Esta documentación

## 🚀 Comandos de Ejecución

### Comandos Básicos

```bash
# Ejecutar todas las pruebas E2E
npm run test:e2e

# Ejecutar con interfaz visual
npm run test:e2e:ui

# Ejecutar en modo headed (ver navegador)
npm run test:e2e:headed

# Ejecutar en modo debug
npm run test:e2e:debug

# Ver reporte de resultados
npm run test:e2e:report

# Instalar navegadores de Playwright
npm run test:e2e:install
```

### Comandos Específicos

```bash
# Ejecutar solo pruebas de chat
npx playwright test chat-flow

# Ejecutar solo pruebas de voz
npx playwright test voice-features

# Ejecutar solo pruebas de errores
npx playwright test error-handling

# Ejecutar solo pruebas de accesibilidad
npx playwright test accessibility

# Ejecutar en navegador específico
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Ejecutar con filtro de nombre
npx playwright test --grep "should send message"
```

## 📋 Prerrequisitos

### Servicios Requeridos

Antes de ejecutar las pruebas, asegúrate de que los siguientes servicios estén ejecutándose:

1. **Backend** en puerto 5000:
   ```bash
   cd server
   npm run dev
   ```

2. **Frontend** en puerto 5173:
   ```bash
   npm run dev
   ```

### Variables de Entorno

Configura las siguientes variables en `server/.env`:

```env
PORT=5000
OPENROUTER_API_KEY=tu_api_key_aqui
MODEL=deepseek/deepseek-chat-v3-0324:free
FRONTEND_ORIGIN=http://localhost:5173
```

## 🎯 Cobertura de Pruebas

### ✅ Funcionalidades Cubiertas

#### Chat Flow (chat-flow.spec.ts)
- ✅ Carga correcta de la interfaz
- ✅ Envío de mensajes
- ✅ Recepción de respuestas streaming
- ✅ Manejo de múltiples mensajes
- ✅ Limpieza del input después del envío
- ✅ Validación de mensajes vacíos
- ✅ Indicador de escritura
- ✅ Peticiones de red correctas
- ✅ Persistencia del historial
- ✅ Atajos de teclado (Enter)
- ✅ Manejo de mensajes largos

#### Voice Features (voice-features.spec.ts)
- ✅ Botón de entrada de voz
- ✅ Estados de grabación
- ✅ Indicador de grabación
- ✅ Timeout de grabación
- ✅ Errores de permisos
- ✅ Funcionalidad TTS
- ✅ Mock de Speech Recognition
- ✅ Errores de reconocimiento
- ✅ Mock de Speech Synthesis
- ✅ Accesibilidad de controles de voz

#### Error Handling (error-handling.spec.ts)
- ✅ Servidor offline
- ✅ Timeout de red
- ✅ Errores del servidor (500, 401, 429)
- ✅ Respuestas malformadas
- ✅ Abortar peticiones
- ✅ Rate limiting
- ✅ Errores de autenticación
- ✅ Respuestas vacías
- ✅ Sistema de reintentos
- ✅ Peticiones concurrentes
- ✅ Estado offline del navegador
- ✅ Limpieza de errores

#### Accessibility (accessibility.spec.ts)
- ✅ Análisis automatizado con axe-core
- ✅ Estructura de headings
- ✅ Navegación por teclado
- ✅ Atributos ARIA
- ✅ Anuncios de screen reader
- ✅ Contraste de colores
- ✅ Manejo de foco
- ✅ Modo de alto contraste
- ✅ Preferencias de movimiento reducido
- ✅ Accesibilidad de entrada de voz
- ✅ Mensajes de error accesibles
- ✅ Soporte de zoom 200%
- ✅ Etiquetas de formularios
- ✅ Atajos de teclado
- ✅ Estados de carga accesibles

## 🔧 Configuración

### Playwright Config

La configuración se encuentra en `playwright.config.ts`:

- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Dispositivos móviles**: Pixel 5, iPhone 12
- **Timeouts**: 30s por prueba, 10s para assertions
- **Reintentos**: 2 en CI, 0 en desarrollo
- **Reportes**: HTML en desarrollo, GitHub en CI
- **Screenshots**: Solo en fallos
- **Videos**: Solo en fallos
- **Trazas**: En reintentos

### Global Setup

El archivo `global-setup.ts` verifica:
- ✅ Backend disponible en puerto 5000
- ✅ Frontend disponible en puerto 5173
- ✅ Endpoints de salud funcionando

## 🛠️ Utilidades de Pruebas

### ChatTestUtils

Clase con métodos para interactuar con el chat:

```typescript
const chatUtils = new ChatTestUtils(page);

// Enviar mensaje y esperar respuesta
await chatUtils.sendMessage('Hola', true);

// Obtener conteo de mensajes
const count = await chatUtils.getMessageCount();

// Verificar estados
await chatUtils.waitForTypingIndicator();
await chatUtils.waitForError();
```

### MockUtils

Clase para simular respuestas del servidor:

```typescript
const mockUtils = new MockUtils(page);

// Simular respuesta exitosa
await mockUtils.mockStreamingSuccess('Respuesta de prueba');

// Simular errores
await mockUtils.mockStreamingError(500, 'Error del servidor');
await mockUtils.mockNetworkFailure();
await mockUtils.mockTimeout();
```

### AccessibilityUtils

Clase para pruebas de accesibilidad:

```typescript
const a11yUtils = new AccessibilityUtils(page);

// Verificar orden de foco
await a11yUtils.checkFocusOrder(['input', 'button']);

// Verificar atributos ARIA
await a11yUtils.checkAriaAttributes('button', {
  'aria-label': 'Enviar mensaje',
  'role': 'button'
});
```

## 📊 Reportes

### HTML Report

Después de ejecutar las pruebas, abre el reporte:

```bash
npm run test:e2e:report
```

El reporte incluye:
- ✅ Resultados por navegador
- ✅ Screenshots de fallos
- ✅ Videos de ejecución
- ✅ Trazas de debugging
- ✅ Métricas de performance

### CI/CD Integration

Para integración continua:

```yaml
# GitHub Actions example
- name: Run E2E tests
  run: |
    npm run dev &
    cd server && npm run dev &
    sleep 10
    npm run test:e2e
```

## 🐛 Debugging

### Modo Debug

```bash
# Ejecutar en modo debug
npm run test:e2e:debug

# Debug de prueba específica
npx playwright test chat-flow --debug
```

### Inspeccionar Elementos

```bash
# Abrir inspector de Playwright
npx playwright codegen localhost:5173
```

### Logs y Trazas

```bash
# Ejecutar con logs detallados
DEBUG=pw:api npx playwright test

# Ver trazas de una prueba específica
npx playwright show-trace test-results/trace.zip
```

## 📝 Mejores Prácticas

### Selectores

- ✅ Usar `data-testid` para elementos de prueba
- ✅ Evitar selectores CSS frágiles
- ✅ Usar selectores semánticos cuando sea posible

### Esperas

- ✅ Usar `expect().toBeVisible()` en lugar de `waitForTimeout()`
- ✅ Configurar timeouts apropiados
- ✅ Esperar estados específicos, no tiempos fijos

### Mocking

- ✅ Mockear APIs externas
- ✅ Simular diferentes estados de error
- ✅ Limpiar mocks entre pruebas

### Accesibilidad

- ✅ Incluir pruebas de navegación por teclado
- ✅ Verificar atributos ARIA
- ✅ Probar con diferentes configuraciones de accesibilidad

## 🔄 Mantenimiento

### Actualizar Navegadores

```bash
npm run test:e2e:install
```

### Actualizar Screenshots Base

```bash
npx playwright test --update-snapshots
```

### Limpiar Reportes

```bash
rm -rf test-results playwright-report
```

## 📞 Soporte

Para problemas con las pruebas E2E:

1. Verificar que los servicios estén ejecutándose
2. Revisar la configuración de variables de entorno
3. Ejecutar en modo debug para más información
4. Consultar los logs del global-setup
5. Verificar la versión de Playwright y navegadores

---

**Total de pruebas**: 329 pruebas en 4 archivos  
**Navegadores soportados**: Chrome, Firefox, Safari, Edge  
**Dispositivos móviles**: Pixel 5, iPhone 12  
**Cobertura**: Chat, Voz, Errores, Accesibilidad