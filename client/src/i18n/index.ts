export type SupportedLanguage = 'en' | 'es';

export function detectLanguage(text: string): SupportedLanguage {
  const t = text.toLowerCase();
  const spanish = [
    'hola','cómo','como','qué','que','dónde','cuando','por qué','porque','para','con','por',
    'una','uno','esta','este','son','ser','tener','hacer','decir','todo','cada','muy','más','mas','pero','sí','si','no',
    'gracias','ayuda','favor','puedes','quiero','necesito','soy','eres','somos','están','estoy','estás',
    'buenos','días','noches','tarde','mañana','ahora','aquí','allí','también'
  ];
  let es = 0, en = 0;
  for (const w of t.split(/\s+/)) if (spanish.includes(w)) es++;
  if (/( the | and | or | but | if | not )/.test(` ${t} `)) en += 2;
  if (/(ing|tion|ness|ment)\b/.test(t)) en++;
  return es > en ? 'es' : 'en';
}

export function getSystemPrompt(language: SupportedLanguage): string {
  if (language === 'es') {
    return `Eres CuraCall Assistant, un asistente de IA avanzado, amable y competente. Responde de forma útil, precisa y completa en español.

Capacidades:
- Responder preguntas (ciencia, tecnología, salud, historia, cultura, educación, etc.).
- Ayudar con tareas prácticas (escritura, análisis, planificación, resolución de problemas).
- Ofrecer explicaciones claras adaptadas al nivel del usuario.
- Mantener conversaciones naturales y contextuales.

Estilo:
- Tono conversacional y profesional.
- Respuestas estructuradas y fáciles de entender.
- Ejemplos cuando aporten claridad.
- Reconoce límites y pide aclaraciones si es necesario.
`;
  }
  return `You are CuraCall Assistant, an advanced, friendly, and competent AI assistant. Provide helpful, accurate, and complete answers in English.

Capabilities:
- Answer questions (science, technology, health, history, culture, education, etc.).
- Help with practical tasks (writing, analysis, planning, problem solving).
- Offer clear explanations adapted to the user's level.
- Maintain natural and contextual conversations.

Style:
- Conversational and professional tone.
- Well-structured, easy-to-understand responses.
- Use examples when helpful.
- Acknowledge limits and ask clarifying questions when needed.
`;
}

export function getUIText(language: SupportedLanguage) {
  if (language === 'es') {
    return {
      greeting: '¡Hola! ¿Cómo puedo ayudarte?',
      instruction: 'Haz clic en el orbe y empieza a hablar',
      listening: 'Escuchando tu voz...',
      processing: 'Procesando con IA...',
      speaking: 'Reproduciendo respuesta...',
      ready: 'Toca el orbe para comenzar',
      modelLoaded: 'Modelo de IA cargado correctamente',
      modelLoadedDesc: 'Ya puedes comenzar a conversar',
      modelError: 'Error al cargar el modelo',
      notReady: 'El modelo de IA no está listo',
      notReadyDesc: 'Espera a que termine de cargar',
      processingError: 'Error al procesar tu mensaje',
      tryAgain: 'Inténtalo de nuevo',
    } as const;
  }
  return {
    greeting: 'Hello! How can I help you?',
    instruction: 'Click the orb and start speaking',
    listening: 'Listening to your voice...',
    processing: 'Processing with AI...',
    speaking: 'Playing response...',
    ready: 'Click the orb to begin',
    modelLoaded: 'AI model loaded successfully',
    modelLoadedDesc: 'You can now start chatting',
    modelError: 'Error loading model',
    notReady: 'AI model is not ready',
    notReadyDesc: 'Please wait for it to finish loading',
    processingError: 'Error processing your message',
    tryAgain: 'Please try again',
  } as const;
}

