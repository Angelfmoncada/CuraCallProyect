import { useEffect, useRef } from "react";

export function ParticleSystem() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create particles
    const particles = Array.from({ length: 9 }, (_, i) => {
      const particle = document.createElement("div");
      particle.className = "particle animate-particles";
      particle.style.left = `${(i + 1) * 10}%`;
      particle.style.animationDuration = `${15 + Math.random() * 8}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      return particle;
    });

    particles.forEach(particle => container.appendChild(particle));

    return () => {
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      data-testid="particle-system"
    />
  );
}
