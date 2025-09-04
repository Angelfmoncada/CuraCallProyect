# Server Quick Start

# 1) Install deps
uvicorn --version || pip install -U pip
pip install -e . || pip install fastapi uvicorn[standard] pydantic ollama

# 2) Run Ollama locally and pull the model
# (in another terminal)
ollama serve
ollama pull gemma3:4b

# 3) Start API
uvicorn main:app --reload --port 8000

# Test
curl -s http://localhost:8000/api/health | jq