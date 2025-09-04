# Gemma3 Voice Chat 🎤🤖

Un chatbot completo con capacidades de voz que utiliza **Ollama (Gemma3:4B)**, **FastAPI**, **Next.js** y **Web Speech API**. Permite conversaciones por voz y texto con respuestas en tiempo real mediante streaming.

## 🚀 Características

- 🎙️ **Reconocimiento de voz** (Speech-to-Text) usando Web Speech API
- 🔊 **Síntesis de voz** (Text-to-Speech) para respuestas del asistente
- ⚡ **Streaming en tiempo real** de respuestas del modelo
- 🎨 **Interfaz moderna** con TailwindCSS y Framer Motion
- 🤖 **Modelo Gemma3:4B** ejecutándose localmente con Ollama
- 📱 **Diseño responsive** que funciona en desktop y móvil

## 📋 Requisitos

- **Node.js** 18+ 
- **Python** 3.8+
- **Ollama** instalado y ejecutándose

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd curacall11
```

### 2. Configurar Ollama

```bash
# Instalar Ollama (si no está instalado)
curl -fsSL https://ollama.ai/install.sh | sh

# Iniciar el servicio
ollama serve

# Descargar el modelo Gemma3:4B
ollama pull gemma3:4b
```

### 3. Configurar el Backend

```bash
cd server

# Instalar dependencias
pip install -U pip
pip install -e . || pip install fastapi uvicorn[standard] pydantic ollama

# Copiar variables de entorno (opcional)
cp .env.example .env

# Iniciar el servidor
uvicorn main:app --reload --port 8000
```

El backend estará disponible en `http://localhost:8000`

### 4. Configurar el Frontend

```bash
cd ../web

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## 🎯 Uso

1. **Abrir la aplicación** en `http://localhost:3000`
2. **Escribir un mensaje** en el campo de texto o **hacer clic en el micrófono** para usar reconocimiento de voz
3. **Enviar el mensaje** y ver la respuesta en tiempo real
4. **Escuchar la respuesta** (se reproduce automáticamente si el navegador lo permite)

### Navegadores Compatibles

- **Chrome/Edge**: Soporte completo para voz
- **Firefox**: Funcionalidad limitada de voz
- **Safari**: Soporte parcial

> **Nota**: Si el reconocimiento de voz no funciona, puedes usar el teclado normalmente.

## 🏗️ Estructura del Proyecto

```
curacall11/
├── server/                 # Backend FastAPI
│   ├── main.py            # Aplicación principal
│   ├── pyproject.toml     # Dependencias Python
│   ├── .env.example       # Variables de entorno
│   └── README.md          # Documentación del backend
├── web/                   # Frontend Next.js
│   ├── app/               # App Router de Next.js
│   │   ├── components/    # Componentes React
│   │   ├── layout.tsx     # Layout principal
│   │   └── page.tsx       # Página principal
│   ├── styles/            # Estilos globales
│   ├── package.json       # Dependencias Node.js
│   └── *.config.*         # Archivos de configuración
└── README.md              # Este archivo
```

## 🔧 API Endpoints

### Backend (Puerto 8000)

- `GET /api/health` - Estado del servidor
- `GET /api/models` - Modelos disponibles en Ollama
- `POST /api/chat` - Chat sin streaming
- `POST /api/chat/stream` - Chat con streaming (usado por el frontend)

### Ejemplo de uso de la API

```bash
# Probar el endpoint de salud
curl http://localhost:8000/api/health

# Enviar un mensaje
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola, ¿cómo estás?", "model": "gemma3:4b"}'
```

## 🐳 Docker (Opcional)

### Backend

```bash
cd server
docker build -t gemma3-chat-backend .
docker run -p 8000:8000 gemma3-chat-backend
```

### Frontend

```bash
cd web
docker build -t gemma3-chat-frontend .
docker run -p 3000:3000 gemma3-chat-frontend
```

## 🛠️ Desarrollo

### Comandos útiles

```bash
# Backend
cd server
uvicorn main:app --reload --port 8000  # Desarrollo
uvicorn main:app --host 127.0.0.1 --port 8000  # Producción

# Frontend
cd web
npm run dev        # Desarrollo
npm run build      # Construir para producción
npm run start      # Ejecutar versión de producción
npm run lint       # Linter
```

### Variables de Entorno

**Backend** (`server/.env`):
```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
```

**Frontend** (opcional):
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## 🔍 Solución de Problemas

### Ollama no responde
- Verificar que Ollama esté ejecutándose: `ollama serve`
- Verificar que el modelo esté descargado: `ollama list`
- Probar el modelo: `ollama run gemma3:4b "Hola"`

### Error de CORS
- El backend ya incluye configuración CORS para desarrollo
- Para producción, ajustar los orígenes permitidos en `server/main.py`

### Reconocimiento de voz no funciona
- Usar Chrome o Edge para mejor compatibilidad
- Verificar permisos del micrófono en el navegador
- Usar HTTPS en producción (requerido por Web Speech API)

### Puerto ocupado
```bash
# Cambiar puerto del backend
uvicorn main:app --port 8001

# Cambiar puerto del frontend
npm run dev -- --port 3001
```

## 📝 Licencia

Este proyecto está bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

---

**¡Disfruta conversando con Gemma3! 🎉**