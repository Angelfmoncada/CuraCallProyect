declare global {
  interface Navigator { gpu?: GPU }
  interface Window { 
    SpeechRecognition?: { new(): SpeechRecognition };
    webkitSpeechRecognition?: { new(): SpeechRecognition };
  }
}
export {};