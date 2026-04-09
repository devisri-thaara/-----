import React, { useEffect, useRef } from 'react';

interface WeatherEffectsProps {
  condition?: string;
}

export const WeatherEffects: React.FC<WeatherEffectsProps> = ({ condition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    const cond = condition?.toLowerCase() || '';

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const createParticles = () => {
      particles = [];
      const count = cond.includes('rain') ? 150 : cond.includes('snow') ? 100 : cond.includes('clear') ? 0 : 50;
      
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          length: Math.random() * 20 + 10,
          speed: Math.random() * 10 + 5,
          opacity: Math.random() * 0.5,
          size: Math.random() * 3 + 1
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (cond.includes('rain')) {
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        ctx.lineWidth = 1;
        particles.forEach(p => {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.length);
          ctx.stroke();
          p.y += p.speed;
          if (p.y > canvas.height) p.y = -p.length;
        });
      } else if (cond.includes('snow')) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speed * 0.3;
          p.x += Math.sin(p.y * 0.01) * 0.5;
          if (p.y > canvas.height) p.y = -p.size;
        });
      } else if (cond.includes('clear') && !isNight()) {
        // Glowing sun effect handled by CSS, but could add dust motes
        ctx.fillStyle = 'rgba(255, 255, 200, 0.1)';
        particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          p.y -= p.speed * 0.1;
          if (p.y < 0) p.y = canvas.height;
        });
      } else if (isNight()) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        particles.forEach(p => {
          const blink = Math.sin(Date.now() * 0.001 + p.x) * 0.5 + 0.5;
          ctx.globalAlpha = p.opacity * blink;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const isNight = () => {
      const hour = new Date().getHours();
      return hour < 6 || hour > 18;
    };

    createParticles();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [condition]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
