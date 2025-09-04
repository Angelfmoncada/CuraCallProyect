/**
 * Language detection utilities
 * Detects language between Spanish and English
 */

// Simple language detection based on common words and patterns
const spanishWords = [
  'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para',
  'como', 'está', 'tú', 'me', 'una', 'todo', 'pero', 'más', 'hacer', 'o', 'puede', 'tiempo', 'si', 'él', 'mis', 'otro',
  'cómo', 'qué', 'sí', 'porque', 'cuando', 'muy', 'sin', 'sobre', 'también', 'yo', 'hasta', 'hay', 'donde', 'quien',
  'desde', 'todos', 'durante', 'tanto', 'ella', 'entre', 'sus', 'ser', 'tiene', 'estoy', 'esta', 'ese', 'era', 'tengo'
];

const englishWords = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
  'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
  'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your'
];

/**
 * Detects if text is in Spanish or English
 * @param text - Text to analyze
 * @returns 'es' for Spanish, 'en' for English
 */
function detectLang2(text: string): 'es' | 'en' {
  if (!text || text.trim().length === 0) {
    return 'en'; // Default to English for empty text
  }

  // Convert to lowercase and split into words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 1); // Filter out single characters

  if (words.length === 0) {
    return 'en';
  }

  let spanishScore = 0;
  let englishScore = 0;

  // Count matches with common words
  words.forEach(word => {
    if (spanishWords.includes(word)) {
      spanishScore++;
    }
    if (englishWords.includes(word)) {
      englishScore++;
    }
  });

  // Additional Spanish patterns
  const spanishPatterns = [
    /ñ/, // Spanish ñ
    /[áéíóúü]/, // Spanish accents
    /ción$/, // Spanish -ción endings
    /dad$/, // Spanish -dad endings
    /mente$/, // Spanish -mente endings
  ];

  // Additional English patterns
  const englishPatterns = [
    /ing$/, // English -ing endings
    /tion$/, // English -tion endings
    /ly$/, // English -ly endings
    /ed$/, // English -ed endings
  ];

  // Check patterns
  spanishPatterns.forEach(pattern => {
    if (pattern.test(text.toLowerCase())) {
      spanishScore += 2; // Pattern matches are weighted more
    }
  });

  englishPatterns.forEach(pattern => {
    if (pattern.test(text.toLowerCase())) {
      englishScore += 2;
    }
  });

  // If no clear winner, check for specific Spanish indicators
  if (spanishScore === englishScore) {
    // Check for Spanish-specific characters or words
    if (/[ñáéíóúü¿¡]/.test(text) || 
        /\b(está|cómo|qué|sí|también|año|niño)\b/i.test(text)) {
      return 'es';
    }
    
    // Default to English if still tied
    return 'en';
  }

  return spanishScore > englishScore ? 'es' : 'en';
}

/**
 * Get language name from code
 * @param langCode - Language code ('es' or 'en')
 * @returns Full language name
 */
export function getLanguageName(langCode: 'es' | 'en'): string {
  return langCode === 'es' ? 'Spanish' : 'English';
}

/**
 * Check if text contains mixed languages
 * @param text - Text to analyze
 * @returns true if text appears to contain both languages
 */
export function hasMixedLanguages(text: string): boolean {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);

  let spanishCount = 0;
  let englishCount = 0;

  words.forEach(word => {
    if (spanishWords.includes(word)) spanishCount++;
    if (englishWords.includes(word)) englishCount++;
  });

  // Consider mixed if both languages have significant presence
  const totalMatches = spanishCount + englishCount;
  if (totalMatches < 2) return false;

  const spanishRatio = spanishCount / totalMatches;
  const englishRatio = englishCount / totalMatches;

  // Mixed if both languages have at least 25% presence
  return spanishRatio >= 0.25 && englishRatio >= 0.25;
}

// Export the main function both as named and default export
export { detectLang2 };
export default detectLang2;