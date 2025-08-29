# CuraCall – OpenRouter Streaming + Voz

Este repo integra un endpoint backend con streaming vía OpenRouter (modelo `deepseek/deepseek-chat-v3-0324:free`) y voz en navegador (STT/TTS) usando la Web Speech API. No se expone ninguna API key en el frontend.

## Configuración

Crear `server/.env` con:

```
OPENROUTER_API_KEY=<tu_api_key_de_openrouter>
MODEL=deepseek/deepseek-chat-v3-0324:free
PORT=5001
FRONTEND_ORIGIN=http://localhost:5173
```

**IMPORTANTE:** No subir el `.env` al repositorio.

Dependencias backend: `express`, `cors`, `dotenv` (ya incluidas en `package.json`).

## Levantar el proyecto

1. **Backend** (puerto 5001):
   ```bash
   cd server
   npm run dev
   ```

2. **Frontend** (puerto 5173):
   ```bash
   npx vite --port 5173
   ```

## Endpoints

- `GET /api/ai/health` – verificar estado de OpenRouter y modelo.
- `POST /api/ai/stream` – stream de tokens desde OpenRouter.
  - Body: `{ text: string, history?: Array<{role:'system'|'user'|'assistant', content:string}>, lang?: string }`
  - Eventos SSE:
    - `event: token` con `data: {"text":"<delta>"}` por cada fragmento.
    - `event: done` al terminar.
    - `event: fallback` si hay error/timeout.
  - Keep-alive: `: ping` cada 30s.
  - CORS restringido a `FRONTEND_ORIGIN`.

## Servicio de streaming en cliente

Archivo: `client/src/lib/ai/streamChat.ts`

```typescript
const ctl = streamChat({
  prompt: 'Hola',
  history: [],
  onToken: (t) => console.log('delta', t),
  onDone: (full) => console.log('final', full),
  onError: (err) => console.error(err),
});
ctl.start();
// ctl.abort(); // para cancelar
```

## Pruebas con curl

**Verificar salud del servicio:**
```bash
curl http://localhost:5001/api/ai/health
```

**Probar streaming:**
```bash
curl -N -X POST http://localhost:5001/api/ai/stream \
  -H "Content-Type: application/json" \
  -d '{"text":"Hola, ¿cómo estás?"}'
```

## Voz (navegador)

Archivo: `client/src/hooks/useSpeech.ts`

- `startSTT({ lang, onText, onError })` - Speech-to-Text
- `speak({ text, lang, rate, volume })` - Text-to-Speech

## Manejo de errores

- **401/403**: API key inválida o sin permisos
- **429**: Rate limit excedido (backoff automático)
- **5xx**: Error del servidor OpenRouter
- **Timeout**: Si no llega el primer token en 15-20s
- **Fallback**: Mensaje legible al usuario en caso de error

## Límites del modelo gratuito

- Modelo: `deepseek/deepseek-chat-v3-0324:free`
- Rate limits aplicados por OpenRouter
- Reintentos automáticos en caso de 429
- Historial limitado a últimos 20 turnos

## Seguridad

✅ API key solo en backend (.env)
✅ CORS restringido a frontend origin
✅ Validación de entrada
✅ Manejo seguro de errores
✅ No exposición de secretos en cliente
- La API key solo se usa en el backend.

## Notas

- Modelos `:free` pueden rate-limitar; usa el backoff y vuelve a intentar.
- Verifica que `FRONTEND_ORIGIN` coincida con tu origen del cliente.

