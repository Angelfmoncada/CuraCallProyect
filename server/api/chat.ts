import { Request, Response } from 'express';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

// Demo responses (English default)
const demoResponses = [
  "Hello! I'm your voice assistant. How can I help today?",
  "Got it. I'm here to assist with any question.",
  "Thanks for using the voice system. Anything else I can help with?",
  "All set, I've processed your request. Need anything else?",
  "I'm operating correctly. The voice system is up.",
  "Your message was received and processed successfully.",
  "Excellent! Speech recognition is working perfectly.",
  "I'm your virtual assistant and ready to help with your questions."
];

function getRandomResponse(): string {
  return demoResponses[Math.floor(Math.random() * demoResponses.length)];
}

function generateContextualResponse(userMessage: string, lang: 'en'|'es'='en'): string {
  const message = userMessage.toLowerCase();
  if (lang==='es') {
    if (/(hola|buenos|saludos)/.test(message)) return '¡Hola! ¿En qué puedo asistirte hoy?';
    if (/(cómo estás|como estas)/.test(message)) return '¡Estoy funcionando perfectamente! ¿Cómo puedo ayudarte?';
    if (/gracias/.test(message)) return '¡De nada! ¿Hay algo más que necesites?';
    if (/(adios|hasta luego)/.test(message)) return '¡Hasta luego! Que tengas un excelente día.';
    if (/(ayuda|help)/.test(message)) return 'Por supuesto, estoy aquí para ayudarte. Hazme cualquier pregunta.';
    if (/(tiempo|clima)/.test(message)) return 'No tengo clima en tiempo real, pero puedo ayudarte con otras consultas.';
    if (/nombre/.test(message)) return 'Soy tu asistente de voz de CuraCall.';
    return `He escuchado: "${userMessage}". ${getRandomResponse()}`;
  }
  if (/(hello|hi|hey|greetings)/.test(message)) return 'Hello! How can I assist you today?';
  if (/(how are you)/.test(message)) return "I'm working perfectly! How can I help?";
  if (/(thanks|thank you)/.test(message)) return "You're welcome! Anything else you need?";
  if (/(bye|goodbye|see you)/.test(message)) return 'Goodbye! Have a great day.';
  if (/(help|assist)/.test(message)) return "Of course—I'm here to help. Ask me anything.";
  if (/(weather|temperature)/.test(message)) return "I don't have real-time weather, but I can help with other questions.";
  if (/(your name|who are you)/.test(message)) return "I'm CuraCall's voice assistant.";
  return `I heard you say: "${userMessage}". ${getRandomResponse()}`;
}

export async function handleChatRequest(req: Request, res: Response) {
  try {
    const { messages }: ChatRequest = req.body;
    const langHeader = (req.headers['accept-language'] as string | undefined)?.toLowerCase() || '';
    const lang: 'en'|'es' = langHeader.startsWith('es') ? 'es' : 'en';
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: lang==='es' ? 'Se requiere un array de mensajes válido' : 'A valid messages array is required' });
    }
    
    // Get last user message
    const lastUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop();
    
    if (!lastUserMessage) {
      return res.status(400).json({ error: lang==='es' ? 'No se encontró un mensaje del usuario' : 'No user message found' });
    }
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 800));
    
    // Generate contextual reply
    const reply = generateContextualResponse(lastUserMessage.content, lang);
    
    res.json({ reply, timestamp: new Date().toISOString(), processed: true });
    
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Internal server error', error_es: 'Error interno del servidor' });
  }
}

// Health endpoint
export async function handleHealthCheck(_req: Request, res: Response) {
  res.json({ status: 'ok', message: 'Chat API healthy', message_es: 'API de chat funcionando correctamente', timestamp: new Date().toISOString() });
}

