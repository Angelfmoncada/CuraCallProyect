import pyttsx3
import io
import wave
import numpy as np
from typing import Optional
import tempfile
import os

class CoquiXTTS:
    """
    Clase para síntesis de voz usando pyttsx3 como alternativa a Coqui TTS.
    Mantiene la misma interfaz que se esperaría de Coqui XTTS-v2.
    """
    
    def __init__(self, device: str = "cpu"):
        """
        Inicializa el motor TTS.
        
        Args:
            device: Dispositivo a usar ("cpu" o "cuda"). Solo CPU soportado con pyttsx3.
        """
        self.device = device
        self.engine = pyttsx3.init()
        
        # Configurar propiedades del motor
        self.engine.setProperty('rate', 150)  # Velocidad de habla
        self.engine.setProperty('volume', 0.9)  # Volumen
        
        # Obtener voces disponibles
        voices = self.engine.getProperty('voices')
        if voices:
            # Preferir voz femenina en inglés si está disponible
            for voice in voices:
                if 'english' in voice.name.lower() and 'female' in voice.name.lower():
                    self.engine.setProperty('voice', voice.id)
                    break
            else:
                # Si no hay voz femenina, usar la primera voz en inglés
                for voice in voices:
                    if 'english' in voice.name.lower():
                        self.engine.setProperty('voice', voice.id)
                        break
                else:
                    # Usar la primera voz disponible
                    self.engine.setProperty('voice', voices[0].id)
    
    def tts_to_file(
        self,
        text: str,
        speaker_wav: Optional[str] = None,
        language: str = "en",
        file_path: Optional[str] = None
    ) -> str:
        """
        Convierte texto a voz y guarda en archivo.
        
        Args:
            text: Texto a convertir
            speaker_wav: Archivo de voz de referencia (no usado en pyttsx3)
            language: Idioma ("en" o "es")
            file_path: Ruta donde guardar el archivo
            
        Returns:
            Ruta del archivo de audio generado
        """
        if file_path is None:
            # Crear archivo temporal
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            file_path = temp_file.name
            temp_file.close()
        
        # Configurar idioma si es posible
        if language == "es":
            voices = self.engine.getProperty('voices')
            for voice in voices:
                if 'spanish' in voice.name.lower() or 'español' in voice.name.lower():
                    self.engine.setProperty('voice', voice.id)
                    break
        
        # Generar audio
        self.engine.save_to_file(text, file_path)
        self.engine.runAndWait()
        
        return file_path
    
    def tts(
        self,
        text: str,
        speaker_wav: Optional[str] = None,
        language: str = "en"
    ) -> np.ndarray:
        """
        Convierte texto a voz y retorna array de audio.
        
        Args:
            text: Texto a convertir
            speaker_wav: Archivo de voz de referencia (no usado en pyttsx3)
            language: Idioma ("en" o "es")
            
        Returns:
            Array numpy con datos de audio
        """
        # Generar archivo temporal
        temp_file = self.tts_to_file(text, speaker_wav, language)
        
        try:
            # Leer archivo de audio
            with wave.open(temp_file, 'rb') as wav_file:
                frames = wav_file.readframes(-1)
                sound_info = wav_file.getparams()
                
                # Convertir a numpy array
                audio_data = np.frombuffer(frames, dtype=np.int16)
                
                # Normalizar a float32 entre -1 y 1
                audio_data = audio_data.astype(np.float32) / 32768.0
                
                return audio_data
        finally:
            # Limpiar archivo temporal
            if os.path.exists(temp_file):
                os.unlink(temp_file)
    
    def get_available_voices(self):
        """
        Obtiene las voces disponibles en el sistema.
        
        Returns:
            Lista de voces disponibles
        """
        voices = self.engine.getProperty('voices')
        return [{
            'id': voice.id,
            'name': voice.name,
            'languages': getattr(voice, 'languages', []),
            'gender': getattr(voice, 'gender', 'unknown')
        } for voice in voices] if voices else []
    
    def set_voice(self, voice_id: str):
        """
        Establece la voz a usar.
        
        Args:
            voice_id: ID de la voz a usar
        """
        self.engine.setProperty('voice', voice_id)
    
    def set_rate(self, rate: int):
        """
        Establece la velocidad de habla.
        
        Args:
            rate: Velocidad en palabras por minuto
        """
        self.engine.setProperty('rate', rate)
    
    def set_volume(self, volume: float):
        """
        Establece el volumen.
        
        Args:
            volume: Volumen entre 0.0 y 1.0
        """
        self.engine.setProperty('volume', max(0.0, min(1.0, volume)))


# Función de conveniencia para crear instancia
def create_tts_engine(device: str = "cpu") -> CoquiXTTS:
    """
    Crea una instancia del motor TTS.
    
    Args:
        device: Dispositivo a usar ("cpu" o "cuda")
        
    Returns:
        Instancia de CoquiXTTS
    """
    return CoquiXTTS(device=device)


if __name__ == "__main__":
    # Prueba básica
    tts = create_tts_engine()
    print("Voces disponibles:")
    for voice in tts.get_available_voices():
        print(f"- {voice['name']} ({voice['id']})")
    
    # Generar audio de prueba
    print("\nGenerando audio de prueba...")
    audio_file = tts.tts_to_file("Hello, this is a test of the text to speech system.")
    print(f"Audio guardado en: {audio_file}")