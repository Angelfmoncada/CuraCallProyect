# CuraCall – AI Voice & Chat Assistant (EN/ES)

This project is now bilingual, with English as the primary language and Spanish as the secondary language. All UI surfaces and system messages default to English, and you can switch to Spanish from the UI language toggle.

## Overview (English)

CuraCall is a modern AI-powered voice and chat assistant built with a full-stack TypeScript architecture. It offers Voice mode for hands-free conversations and Chat mode for text-based interactions. The current integration supports a local LLM via Ollama (llama3.1:8b), with streaming responses from the server.

The app features a glassmorphic dark UI with multiple themes, conversation history, and customizable settings. It’s responsive and accessible.

## Descripción (Español)

CuraCall es un asistente moderno de voz y chat con arquitectura TypeScript full‑stack. Ofrece modo Voz para conversaciones manos libres y modo Chat para texto. La integración actual usa un LLM local con Ollama (llama3.1:8b) y transmisión de respuestas desde el servidor.

La interfaz tiene estilo “glassmorphism” oscuro con varios temas, historial de conversaciones y ajustes personalizables. Es responsiva y accesible.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based frontend built with Vite and TypeScript:

- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Custom React hooks with localStorage persistence for settings and conversation history
- **UI Framework**: Tailwind CSS with shadcn/ui components for consistent design system
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Styling**: OKLCH color system with multiple theme variants (Dark Ocean, Ocean Breeze, Seagrass, Sunset, Midnight)

### Backend Architecture / Arquitectura Backend
The backend follows a minimal Express.js pattern:

- **Server**: Express.js with TypeScript for API endpoints
- **Development**: Vite integration for hot module replacement and development server
- **Storage Interface**: Abstracted storage layer supporting both in-memory and database implementations
- **Database Ready**: Configured for PostgreSQL with Drizzle ORM but currently using in-memory storage

### AI Integration Pattern / Integración de IA
The application implements a sophisticated AI system with fallback capabilities:

- **Primary AI**: WebLLM (@mlc-ai/web-llm) running entirely in browser via WebGPU
- **Model Support**: Llama-3-8B-Instruct or Qwen2.5-3B-Instruct depending on browser capabilities
- **Fallback Mode**: Wikipedia REST API integration when WebGPU is unavailable
- **Voice Integration**: Web Speech API for both Speech-to-Text and Text-to-Speech

### Data Architecture / Arquitectura de Datos
Client-side data persistence using browser localStorage:

- **Conversations**: Full conversation history with archiving and deletion capabilities
- **Settings**: User preferences including themes, voice settings, and AI model preferences
- **State Management**: Reactive hooks pattern with automatic persistence

### Component Architecture / Arquitectura de Componentes
Modular component structure following atomic design principles:

- **Pages**: Route-level components (Dashboard, Chat, History, Settings)
- **Layout Components**: Sidebar, Header, ThemeProvider for application structure
- **Feature Components**: VoiceOrb, ModeToggle, MessageList, InputBar for specific functionality
- **UI Components**: shadcn/ui based design system components
- **Custom Hooks**: Specialized hooks for WebLLM, Speech API, and state management

## External Dependencies / Dependencias Externas

### Core Framework Dependencies
- **@vitejs/plugin-react**: React integration for Vite build system
- **wouter**: Lightweight routing library for single-page application navigation
- **@tanstack/react-query**: Server state management and caching

### UI and Design Dependencies
- **@radix-ui/react-\***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework for styling
- **framer-motion**: Animation library for smooth transitions and interactions
- **lucide-react**: Icon library providing consistent iconography
- **class-variance-authority**: Type-safe variant API for component styling

### AI and Voice Dependencies
- **@mlc-ai/web-llm**: Browser-based large language model inference
- **Web Speech API**: Browser native speech recognition and synthesis (no external dependency)

### Development Dependencies
- **typescript**: Static type checking and development experience
- **vite**: Fast build tool and development server
- **drizzle-orm**: TypeScript ORM for database interactions
- **drizzle-kit**: Database migration and schema management tools

### External APIs
- **Wikipedia REST API**: Fallback knowledge source when WebLLM is unavailable
- **WebGPU**: Browser API for GPU-accelerated AI model inference
- **Web Speech API**: Browser APIs for voice input/output functionality

### Database Integration / Integración de Base de Datos
- **PostgreSQL**: Primary database (configured via DATABASE_URL environment variable)
- **@neondatabase/serverless**: Serverless PostgreSQL driver for production deployment
- **connect-pg-simple**: PostgreSQL session store for Express sessions

The architecture prioritizes privacy and local processing. With Ollama streaming enabled, inference happens on your machine. The backend persists data and exposes the chat streaming endpoint.

## Internationalization (EN default)

- Default interface language: English. Secondary: Spanish.
- Language toggle in the header (EN/ES) stores preference in localStorage.
- STT/TTS adjusts to the chosen language when possible (STT: `en-US` or `es-ES`).
