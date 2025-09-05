# CuraCall - AI Voice Chat Assistant 🎤🤖

A complete voice-enabled chatbot that integrates **OpenRouter streaming**, **FastAPI**, **Next.js**, and **Web Speech API**. Supports both voice and text conversations with real-time streaming responses and demo mode functionality.

## 🚀 Features

- 🎙️ **Speech Recognition** (Speech-to-Text) using Web Speech API
- 🔊 **Voice Synthesis** (Text-to-Speech) for assistant responses
- ⚡ **Real-time streaming** responses from AI models
- 🎨 **Modern interface** with TailwindCSS and Framer Motion
- 🤖 **Multiple AI models** support via OpenRouter and local Ollama
- 📱 **Responsive design** that works on desktop and mobile
- 🎭 **Demo mode** for testing without API keys
- 🌐 **Production ready** with Netlify deployment configuration

## 📋 Requirements

- **Node.js** 18+
- **Python** 3.8+
- **OpenRouter API Key** (for production) or **Ollama** (for local development)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Angelfmoncada/CuracallProyect.git
cd CuracallProyect
```

### 2. Setup Backend (FastAPI)

```bash
cd server

# Install dependencies
pip install -U pip
pip install -e . || pip install fastapi uvicorn[standard] pydantic ollama

# Copy environment variables
cp .env.example .env

# Start the server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### 3. Setup Frontend (Next.js)

```bash
cd ../web

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Backend Environment Variables (`server/.env`)

```env
# For OpenRouter (Production)
OPENROUTER_API_KEY=your_openrouter_api_key_here
MODEL=deepseek/deepseek-chat-v3-0324:free

# For Ollama (Local Development)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma3:4b

# Server Configuration
PORT=8000
FRONTEND_ORIGIN=http://localhost:3000
```

### Frontend Environment Variables (`web/.env.local`)

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Demo Mode (set to 'true' to enable demo without API keys)
NEXT_PUBLIC_DEMO_MODE=false

# TTS Configuration
NEXT_PUBLIC_TTS_ENABLED=true
NEXT_PUBLIC_TTS_PROVIDER=coqui
NEXT_PUBLIC_COQUI_TTS_URL=http://localhost:8000
```

## 🎯 Usage

### Demo Mode

1. Set `NEXT_PUBLIC_DEMO_MODE=true` in your environment
2. Open the application at `http://localhost:3000`
3. Experience the interface with simulated AI responses
4. Perfect for testing UI/UX without API costs

### Production Mode

1. **Configure API keys** in your environment files
2. **Open the application** at `http://localhost:3000`
3. **Type a message** or **click the microphone** for voice recognition
4. **Send the message** and see real-time streaming responses
5. **Listen to responses** (automatically played if browser allows)

### Browser Compatibility

- **Chrome/Edge**: Full voice support
- **Firefox**: Limited voice functionality
- **Safari**: Partial support

> **Note**: If voice recognition doesn't work, you can use the keyboard normally.

## 🏗️ Project Structure

```
CuracallProyect/
├── server/                 # FastAPI Backend
│   ├── main.py            # Main application
│   ├── tts_coqui.py       # TTS service
│   ├── pyproject.toml     # Python dependencies
│   ├── .env.example       # Environment template
│   └── README.md          # Backend documentation
├── web/                   # Next.js Frontend
│   ├── app/               # Next.js App Router
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities and services
│   │   ├── layout.tsx     # Main layout
│   │   └── page.tsx       # Main page
│   ├── components/        # Shared components
│   │   └── ui/           # UI components (shadcn/ui)
│   ├── styles/           # Global styles
│   ├── netlify.toml      # Netlify deployment config
│   ├── .env.example      # Environment template
│   ├── .env.production   # Production environment
│   └── package.json      # Node.js dependencies
└── README.md             # This file
```

## 🔧 API Endpoints

### Backend (Port 8000)

- `GET /api/health` - Server health check
- `GET /api/models` - Available models in Ollama
- `POST /api/chat` - Chat without streaming
- `POST /api/chat/stream` - Chat with streaming (used by frontend)
- `POST /api/tts/coqui` - Text-to-Speech synthesis

### API Usage Examples

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Send a message
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?", "model": "gemma3:4b"}'

# Test streaming
curl -N -X POST http://localhost:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a story"}'
```

## 🚀 Deployment

### Netlify (Frontend)

The project includes Netlify configuration:

1. **Connect your repository** to Netlify
2. **Set build command**: `npm run build`
3. **Set publish directory**: `.next`
4. **Configure environment variables** in Netlify dashboard
5. **Deploy**

### Docker (Optional)

#### Backend
```bash
cd server
docker build -t curacall-backend .
docker run -p 8000:8000 curacall-backend
```

#### Frontend
```bash
cd web
docker build -t curacall-frontend .
docker run -p 3000:3000 curacall-frontend
```

## 🛠️ Development

### Useful Commands

```bash
# Backend
cd server
python -m uvicorn main:app --reload --port 8000  # Development
python -m uvicorn main:app --host 0.0.0.0 --port 8000  # Production

# Frontend
cd web
npm run dev        # Development
npm run build      # Build for production
npm run start      # Run production build
npm run lint       # Linting
```

## 🔍 Troubleshooting

### Ollama not responding
- Verify Ollama is running: `ollama serve`
- Check model is downloaded: `ollama list`
- Test the model: `ollama run gemma3:4b "Hello"`

### CORS errors
- Backend includes CORS configuration for development
- For production, adjust allowed origins in `server/main.py`

### Voice recognition not working
- Use Chrome or Edge for better compatibility
- Check microphone permissions in browser
- Use HTTPS in production (required by Web Speech API)

### Port conflicts
```bash
# Change backend port
python -m uvicorn main:app --port 8001

# Change frontend port
npm run dev -- --port 3001
```

### OpenRouter API Issues
- **401/403**: Invalid API key or insufficient permissions
- **429**: Rate limit exceeded (automatic backoff implemented)
- **5xx**: OpenRouter server error
- **Timeout**: No response within 15-20 seconds

## 🔒 Security

✅ API keys only in backend environment
✅ CORS restricted to frontend origin
✅ Input validation and sanitization
✅ Secure error handling
✅ No secrets exposed in client code

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Enjoy chatting with AI! 🎉**
