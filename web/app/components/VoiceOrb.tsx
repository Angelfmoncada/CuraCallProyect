"use client";

import React, { CSSProperties, useEffect, useRef, useState } from "react";

type Units = "px" | "rem" | "vw" | "vh";

type VoiceOrbProps = {
  /** Diámetro exacto */
  size?: number;
  /** Unidades (px por defecto) */
  unit?: Units;
  /** Posicionamiento absoluto opcional dentro del contenedor padre */
  x?: number; // left
  y?: number; // top
  right?: number;
  bottom?: number;
  /** Velocidad base de animación (1 = normal) */
  speed?: number;
  /** Opacidad global (0–1) */
  opacity?: number;
  /** Escala máxima del "latido" (no altera el tamaño del wrapper) */
  maxPulseScale?: number; // 1.0–1.15 aprox
  /** aria-label */
  label?: string;
  /** Si es false, no solicita micrófono y usa latido autónomo */
  micReactive?: boolean;
  /** Controla si se muestra el label */
  showLabel?: boolean;
};

export default function VoiceOrb({
  size = 320,
  unit = "px",
  x,
  y,
  right,
  bottom,
  speed = 1,
  opacity = 1,
  maxPulseScale = 1.08,
  label = "Voice orb",
  micReactive = true,
  showLabel = true,
}: VoiceOrbProps) {
  const [energy, setEnergy] = useState(0.6); // 0..1
  const [pulse, setPulse] = useState(1);     // escala visual 1..max
  const [systemAudioEnergy, setSystemAudioEnergy] = useState(0.6);
  const [isListening, setIsListening] = useState(false);
  const [systemAudioEnabled, setSystemAudioEnabled] = useState(false);

  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const systemAnalyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    let mounted = true;

    const fallbackAutoPulse = () => {
      // Latido autónomo si no hay micrófono
      const t0 = performance.now();
      const loop = () => {
        if (!mounted) return;
        const t = (performance.now() - t0) / 1000;
        const base = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.8)); // 0.55..1
        setEnergy(base);
        setSystemAudioEnergy(base);
        setPulse(1 + (maxPulseScale - 1) * base);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    };

    const initializeSystemAudio = async () => {
      try {
        // Intentar capturar audio del sistema usando getDisplayMedia
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: false,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            sampleRate: 44100
          } as any
        });
        
        if (!audioCtxRef.current) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioCtxRef.current = ctx;
        }
        
        systemAnalyserRef.current = audioCtxRef.current.createAnalyser();
        const systemSource = audioCtxRef.current.createMediaStreamSource(stream);
        
        systemAnalyserRef.current.fftSize = 1024;
        systemAnalyserRef.current.smoothingTimeConstant = 0.8;
        systemSource.connect(systemAnalyserRef.current);
        
        setSystemAudioEnabled(true);
        startSystemAudioAnalysis();
      } catch (error) {
        console.error('Error accessing system audio:', error);
        setSystemAudioEnabled(false);
      }
    };

    const startSystemAudioAnalysis = () => {
      const loop = () => {
        if (!mounted || !systemAnalyserRef.current) return;

        const timeData = new Uint8Array(systemAnalyserRef.current.fftSize);
        systemAnalyserRef.current.getByteTimeDomainData(timeData);

        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] - 128) / 128; // -1..1
          sum += v * v;
        }
        const rms = Math.sqrt(sum / timeData.length);
        const normalized = Math.min(1, Math.max(0, (rms - 0.02) / 0.25));
        const curved = Math.pow(normalized, 0.8);

        setSystemAudioEnergy((prev) => prev + (curved - prev) * 0.15);

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    };

    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
          },
          video: false,
        });

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.8;

        source.connect(analyser);

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);

        const loop = () => {
          if (!mounted || !analyserRef.current || !dataRef.current) return;

          // Usamos forma de onda para RMS (amplitud instantánea)
          const timeData = new Uint8Array(analyserRef.current.fftSize);
          analyserRef.current.getByteTimeDomainData(timeData);

          let sum = 0;
          for (let i = 0; i < timeData.length; i++) {
            const v = (timeData[i] - 128) / 128; // -1..1
            sum += v * v;
          }
          const rms = Math.sqrt(sum / timeData.length); // 0..~0.5 (hablar sube)
          // Normalizamos a 0..1 y aplicamos curva suave
          const normalized = Math.min(1, Math.max(0, (rms - 0.02) / 0.25));
          const curved = Math.pow(normalized, 0.8);

          // Suavizado exponencial para evitar jitter
          setEnergy((prev) => prev + (curved - prev) * 0.15);
          setIsListening(true);

          const targetScale = 1 + (maxPulseScale - 1) * curved;
          setPulse((prev) => prev + (targetScale - prev) * 0.2);

          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch {
        // Sin permisos o error => latido autónomo
        fallbackAutoPulse();
      }
    };

    if (micReactive && typeof navigator !== "undefined" && navigator.mediaDevices) {
      startMic();
    }
    
    // No inicializar automáticamente el audio del sistema
    // El usuario debe hacer clic en el botón para activarlo
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      fallbackAutoPulse();
    }

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { audioCtxRef.current?.close(); } catch {}
    };
  }, [micReactive, maxPulseScale]);

  const absolutePos: CSSProperties =
    x !== undefined || y !== undefined || right !== undefined || bottom !== undefined
      ? {
          position: "absolute",
          left: x !== undefined ? `${x}${unit}` : undefined,
          top: y !== undefined ? `${y}${unit}` : undefined,
          right: right !== undefined ? `${right}${unit}` : undefined,
          bottom: bottom !== undefined ? `${bottom}${unit}` : undefined,
        }
      : { position: "relative" };

  // Usar la energía más alta entre micrófono y audio del sistema
  const currentEnergy = Math.max(systemAudioEnergy, energy);
  const finalPulse = 1 + (maxPulseScale - 1) * currentEnergy;

  const vars: CSSProperties = {
    ["--orb-size" as any]: `${size}${unit}`,
    ["--energy" as any]: String(currentEnergy),
    ["--speed" as any]: String(speed),
    ["--orb-opacity" as any]: String(opacity),
  };

  return (
    <div
      aria-label={label}
      role="img"
      style={{ ...vars, ...absolutePos, width: `var(--orb-size)`, height: `var(--orb-size)` }}
      className="relative grid place-items-center isolate"
    >

      {/* Esfera principal */}
      <div
        aria-hidden
        className="relative rounded-full overflow-hidden animate-rimPulse"
        style={{
          width: "var(--orb-size)",
          height: "var(--orb-size)",
          backgroundColor: "rgba(6,20,42,0.25)",
          border: "1px solid rgba(130,210,255,0.35)",
          boxShadow:
            "inset 0 0 calc(var(--orb-size)*0.25) rgba(11,166,255,0.35), inset 0 0 calc(var(--orb-size)*0.45) rgba(0,120,255,0.25), 0 0 calc(var(--orb-size)*0.4) rgba(11,166,255,0.5), 0 0 calc(var(--orb-size)*0.2) rgba(53,210,255,0.7)",
          backdropFilter: "blur(1.5px)",
          WebkitBackdropFilter: "blur(1.5px)",
          transform: `scale(${finalPulse})`,
          transformOrigin: "50% 50%",
          backgroundImage: [
            "radial-gradient(60% 65% at 50% 56%, rgba(53,210,255,0.35), rgba(5,32,68,0) 65%)",
            "radial-gradient(75% 75% at 52% 58%, rgba(11,166,255,0.65), rgba(0,120,255,0.12) 55%, rgba(6,20,42,0) 90%)",
            "radial-gradient(100% 100% at 50% 50%, rgba(8,50,112,0.3), rgba(4,10,24,0) 70%)",
          ].join(","),
        }}
      >
        {/* Reflejo especular */}
        <div
          className="absolute pointer-events-none mix-blend-screen"
          style={{
            left: "12%",
            top: "10%",
            width: "30%",
            height: "22%",
            borderRadius: "999px",
            background:
              "radial-gradient(80% 80% at 40% 40%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 35%, rgba(255,255,255,0) 100%)",
            filter: "blur(calc(var(--orb-size)*0.01))",
          }}
        />

        {/* Partículas */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none mix-blend-screen animate-twinkle"
          style={{
            background: [
              "radial-gradient(1px 1px at 25% 35%, rgba(180,240,255,0.8), transparent 70%)",
              "radial-gradient(1.2px 1.2px at 65% 60%, rgba(180,240,255,0.7), transparent 70%)",
              "radial-gradient(0.8px 0.8px at 45% 55%, rgba(180,240,255,0.7), transparent 70%)",
              "radial-gradient(0.6px 0.6px at 60% 40%, rgba(180,240,255,0.6), transparent 70%)",
            ].join(","),
          }}
        />

        {/* Filamentos de energía */}
        <svg
          aria-hidden
          className="absolute inset-[4%] pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          style={{
            opacity: `calc(0.35 + 0.65 * var(--energy))`,
            filter: "drop-shadow(0 0 6px rgba(53,210,255,0.5))",
            mixBlendMode: "screen",
          }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="stroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(180,240,255,0.0)" />
              <stop offset="35%" stopColor="rgba(120,220,255,0.35)" />
              <stop offset="65%" stopColor="rgba(0,160,255,0.6)" />
              <stop offset="100%" stopColor="rgba(0,120,255,0.0)" />
            </linearGradient>
          </defs>

          <path
            d="M 6 60 C 30 30, 60 80, 94 40"
            stroke="url(#stroke)"
            strokeWidth="1.2"
            fill="none"
            filter="url(#glow)"
            className="dashA"
          />
          <path
            d="M 10 50 C 28 24, 72 76, 90 34"
            stroke="url(#stroke)"
            strokeWidth="0.9"
            fill="none"
            filter="url(#glow)"
            className="dashB"
          />
          <path
            d="M 8 68 C 22 52, 78 56, 92 28"
            stroke="url(#stroke)"
            strokeWidth="0.8"
            fill="none"
            filter="url(#glow)"
            className="dashC"
          />
        </svg>
      </div>




    </div>
  );
}