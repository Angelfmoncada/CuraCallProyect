/**
 * Language detection utility for English and Spanish
 */

export type SupportedLanguage = 'en' | 'es';

/**
 * Simple language detection based on common words and patterns
 * @param text - The text to analyze
 * @returns The detected language ('en' or 'es')
 */
export function detectLanguage(text: string): SupportedLanguage {
  const normalizedText = text.toLowerCase().trim();
  
  // Spanish indicators
  const spanishWords = [
    'hola', 'como', 'que', 'donde', 'cuando', 'porque', 'para', 'con', 'por',
    'una', 'uno', 'esta', 'este', 'son', 'ser', 'tener', 'hacer', 'decir',
    'todo', 'cada', 'muy', 'mas', 'pero', 'si', 'no', 'me', 'te', 'se',
    'gracias', 'ayuda', 'favor', 'puedes', 'quiero', 'necesito', 'soy',
    'eres', 'somos', 'están', 'estoy', 'estás', 'está', 'buenos', 'días',
    'noches', 'tarde', 'mañana', 'ahora', 'aquí', 'allí', 'también'
  ];
  
  // English indicators
  const englishWords = [
    'hello', 'how', 'what', 'where', 'when', 'why', 'for', 'with', 'by',
    'the', 'and', 'or', 'but', 'if', 'not', 'me', 'you', 'we', 'they',
    'this', 'that', 'these', 'those', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might',
    'thanks', 'help', 'please', 'want', 'need', 'am', 'is', 'are',
    'was', 'were', 'been', 'being', 'good', 'morning', 'evening',
    'night', 'today', 'tomorrow', 'now', 'here', 'there', 'also'
  ];
  
  // Count matches
  let spanishScore = 0;
  let englishScore = 0;
  
  const words = normalizedText.split(/\s+/);
  
  for (const word of words) {
    if (spanishWords.includes(word)) {
      spanishScore++;
    }
    if (englishWords.includes(word)) {
      englishScore++;
    }
  }
  
  // Check for Spanish-specific patterns
  if (/ñ/.test(normalizedText)) spanishScore += 2;
  if (/¿|¡/.test(normalizedText)) spanishScore += 2;
  if (/ción|sión|dad|mente/.test(normalizedText)) spanishScore += 1;
  
  // Check for English-specific patterns
  if (/\b(ing|tion|sion|ness|ment)\b/.test(normalizedText)) englishScore += 1;
  if (/\b(the|and|or|but|if|not)\b/.test(normalizedText)) englishScore += 1;
  
  // Default to Spanish if no clear indicators (since it's the primary language)
  return spanishScore >= englishScore ? 'es' : 'en';
}

/**
 * Get system prompt based on detected language
 * @param language - The target language
 * @returns The appropriate system prompt
 */
export function getSystemPrompt(language: SupportedLanguage): string {
  const prompts = {
    es: `Eres CuraCall Assistant, un asistente de IA avanzado, amigable y altamente competente. Tu misión es proporcionar respuestas útiles, precisas y completas en español.

Capacidades principales:
- Responder preguntas sobre una amplia variedad de temas: ciencia, tecnología, historia, cultura, salud, educación, entretenimiento, etc.
- Ayudar con tareas prácticas: escritura, análisis, resolución de problemas, planificación, etc.
- Proporcionar explicaciones claras y educativas adaptadas al nivel del usuario
- Ofrecer múltiples perspectivas cuando sea apropiado
- Mantener conversaciones naturales y contextuales

Estilo de comunicación:
- Tono conversacional, profesional y empático
- Respuestas estructuradas y fáciles de entender
- Ejemplos prácticos cuando sea útil
- Reconoce limitaciones cuando no tengas información suficiente
- Pregunta por clarificaciones si la consulta es ambigua

Siempre responde en español de manera clara, precisa y útil.`,
    en: `You are CuraCall Assistant, an advanced, friendly, and highly competent AI assistant. Your mission is to provide helpful, accurate, and comprehensive responses in English.

Core capabilities:
- Answer questions across a wide range of topics: science, technology, history, culture, health, education, entertainment, etc.
- Assist with practical tasks: writing, analysis, problem-solving, planning, etc.
- Provide clear and educational explanations adapted to the user's level
- Offer multiple perspectives when appropriate
- Maintain natural and contextual conversations

Communication style:
- Conversational, professional, and empathetic tone
- Well-structured and easy-to-understand responses
- Practical examples when helpful
- Acknowledge limitations when you don't have sufficient information
- Ask for clarifications if the query is ambiguous

Always respond in English in a clear, accurate, and helpful manner.`
  };
  
  return prompts[language];
}

/**
 * Get UI text based on language
 * @param language - The target language
 * @returns Object with UI text translations
 */
export function getUIText(language: SupportedLanguage) {
  const texts = {
    es: {
      greeting: "¡Hola! ¿Cómo puedo ayudarte?",
      instruction: "Haz clic en el orb y comienza a hablar",
      listening: "Escuchando tu voz...",
      processing: "Procesando con IA...",
      speaking: "Reproduciendo respuesta...",
      ready: "Toca el orbe para comenzar",
      modelLoaded: "🤖 Modelo de IA cargado correctamente",
      modelLoadedDesc: "Ya puedes comenzar a conversar",
      modelError: "❌ Error al cargar el modelo",
      notReady: "El modelo de IA no está listo",
      notReadyDesc: "Espera a que termine de cargar",
      processingError: "Error al procesar tu mensaje",
      tryAgain: "Intenta de nuevo"
    },
    en: {
      greeting: "Hello! How can I help you?",
      instruction: "Click the orb and start speaking",
      listening: "Listening to your voice...",
      processing: "Processing with AI...",
      speaking: "Playing response...",
      ready: "Touch the orb to begin",
      modelLoaded: "🤖 AI model loaded successfully",
      modelLoadedDesc: "You can now start conversing",
      modelError: "❌ Error loading model",
      notReady: "AI model is not ready",
      notReadyDesc: "Please wait for it to finish loading",
      processingError: "Error processing your message",
      tryAgain: "Please try again"
    }
  };
  
  return texts[language];
}