# server/main.py
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Literal, Optional, Dict, Any, Generator
import os
import tempfile
import uuid

# Use requests for Ollama API calls to avoid WinError 10049
#   pip install requests fastapi uvicorn pydantic
import requests
import json

# Import TTS functionality
from tts_coqui import create_tts_engine

def _normalize_base(url: str) -> str:
    """Normalize Ollama base URL to avoid connection issues."""
    if not url:
        return "http://127.0.0.1:11434"
    u = url.strip()
    # Convert 0.0.0.0 to 127.0.0.1 to avoid connection adapter errors
    if u.startswith("0.0.0.0"):
        u = u.replace("0.0.0.0", "127.0.0.1", 1)
    # Ensure protocol is present
    if not u.startswith("http://") and not u.startswith("https://"):
        u = "http://" + u
    return u.rstrip("/")

OLLAMA_HOST = _normalize_base(os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434"))
MODEL = os.getenv("OLLAMA_MODEL", "gemma3:4b")

app = FastAPI(title="Gemma3 Voice Chatbot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = None
    options: Optional[Dict[str, Any]] = None  # e.g. {"temperature": 0.7}

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "en"
    voice_id: Optional[str] = None
    rate: Optional[int] = 150
    volume: Optional[float] = 0.9

@app.get("/api/health")
async def health() -> Dict[str, str]:
    return {"status": "ok", "model": MODEL}

@app.get("/api/models")
async def models():
    try:
        response = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    """
    Streams plain-text tokens for low-latency UI.
    Frontend reads the body as a stream and appends text as it arrives.
    """
    model = req.model or MODEL
    messages = [m.model_dump() for m in req.messages]
    options = req.options or {"temperature": 0.7}

    def token_generator() -> Generator[bytes, None, None]:
        try:
            # Use requests directly to avoid WinError 10049
            payload = {
                "model": model,
                "messages": messages,
                "stream": True,
                "options": options
            }
            
            response = requests.post(
                f"{OLLAMA_HOST}/api/chat",
                json=payload,
                stream=True,
                timeout=30,
                headers={'Content-Type': 'application/json'}
            )
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    try:
                        chunk_data = json.loads(line.decode('utf-8'))
                        delta = chunk_data.get("message", {}).get("content", "")
                        if delta:
                            yield delta.encode("utf-8")
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            yield f"\n[SERVER ERROR] {str(e)}".encode("utf-8")

    return StreamingResponse(token_generator(), media_type="text/plain; charset=utf-8")

@app.post("/api/chat")
async def chat_complete(req: ChatRequest):
    """Non-streaming endpoint (returns full assistant message)."""
    try:
        model = req.model or MODEL
        messages = [m.model_dump() for m in req.messages]
        options = req.options or {"temperature": 0.7}
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": options
        }
        
        response = requests.post(
            f"{OLLAMA_HOST}/api/chat",
            json=payload,
            timeout=30,
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        return JSONResponse(response.json())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Initialize TTS engine globally
tts_engine = None

def get_tts_engine():
    """Get or create TTS engine instance."""
    global tts_engine
    if tts_engine is None:
        tts_engine = create_tts_engine(device="cpu")
    return tts_engine

@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    """Convert text to speech and return audio file."""
    try:
        tts = get_tts_engine()
        
        # Configure TTS settings
        if req.voice_id:
            tts.set_voice(req.voice_id)
        if req.rate:
            tts.set_rate(req.rate)
        if req.volume:
            tts.set_volume(req.volume)
        
        # Generate unique filename
        audio_filename = f"tts_{uuid.uuid4().hex}.wav"
        temp_dir = tempfile.gettempdir()
        audio_path = os.path.join(temp_dir, audio_filename)
        
        # Generate speech
        output_path = tts.tts_to_file(
            text=req.text,
            language=req.language,
            file_path=audio_path
        )
        
        # Return audio file
        return FileResponse(
            path=output_path,
            media_type="audio/wav",
            filename=audio_filename,
            headers={"Content-Disposition": f"attachment; filename={audio_filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS Error: {str(e)}")

@app.get("/api/tts/voices")
async def get_voices():
    """Get available TTS voices."""
    try:
        tts = get_tts_engine()
        voices = tts.get_available_voices()
        return {"voices": voices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting voices: {str(e)}")

@app.post("/api/tts/test")
async def test_tts():
    """Test TTS functionality with a simple message."""
    try:
        tts = get_tts_engine()
        
        # Generate test audio
        test_text = "Hello! This is a test of the text to speech system."
        audio_filename = f"tts_test_{uuid.uuid4().hex}.wav"
        temp_dir = tempfile.gettempdir()
        audio_path = os.path.join(temp_dir, audio_filename)
        
        output_path = tts.tts_to_file(
            text=test_text,
            language="en",
            file_path=audio_path
        )
        
        return FileResponse(
            path=output_path,
            media_type="audio/wav",
            filename=audio_filename,
            headers={"Content-Disposition": f"attachment; filename={audio_filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS Test Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)