import React, { useEffect, useRef } from 'react';

interface StarNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  color: string;
}

interface FallingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  thickness: number;
  color: string;
}

export const StarfallBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // 1. Star Graph Nodes (drifting gently downward from sky + forming constellation graph edges)
    const starColors = ['#34d399', '#38bdf8', '#e2e8f0', '#a7f3d0', '#93c5fd'];
    const numNodes = Math.min(75, Math.max(40, Math.floor((width * height) / 22000)));

    const nodes: StarNode[] = Array.from({ length: numNodes }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.35) * 0.28,
      vy: 0.25 + Math.random() * 0.55, // gentle fall from sky
      radius: 1.1 + Math.random() * 1.8,
      alpha: 0.35 + Math.random() * 0.6,
      twinkleSpeed: 0.008 + Math.random() * 0.02,
      color: starColors[Math.floor(Math.random() * starColors.length)]
    }));

    // 2. Falling Shooting Stars (Starfall streaks from sky)
    const createFallingStar = (randomY = false): FallingStar => {
      const angle = Math.PI / 3.4 + (Math.random() - 0.5) * 0.18; // ~53 deg diagonal fall
      return {
        x: Math.random() * (width * 1.2) - width * 0.2,
        y: randomY ? Math.random() * height : -40 - Math.random() * 200,
        length: 65 + Math.random() * 95,
        speed: 3.2 + Math.random() * 4.5,
        angle,
        opacity: 0.45 + Math.random() * 0.5,
        thickness: 1.2 + Math.random() * 1.3,
        color: Math.random() > 0.45 ? '#34d399' : '#38bdf8'
      };
    };

    const fallingStars: FallingStar[] = Array.from({ length: 7 }, () =>
      createFallingStar(true)
    );

    const connectionDistance = 145;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Star Graph Constellation Edges
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const lineAlpha = (1 - dist / connectionDistance) * 0.16;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Update & Draw Star Graph Nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.alpha += node.twinkleSpeed;
        if (node.alpha > 0.95 || node.alpha < 0.25) {
          node.twinkleSpeed = -node.twinkleSpeed;
        }

        // Wrap around sky when falling off bottom
        if (node.y > height + 10) {
          node.y = -10;
          node.x = Math.random() * width;
        }
        if (node.x > width + 10) node.x = -10;
        if (node.x < -10) node.x = width + 10;

        ctx.save();
        ctx.globalAlpha = Math.max(0.2, Math.min(1, node.alpha));
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }

      // Update & Draw Falling Shooting Stars from Sky
      for (let i = 0; i < fallingStars.length; i++) {
        const star = fallingStars[i];
        const vx = Math.cos(star.angle) * star.speed;
        const vy = Math.sin(star.angle) * star.speed;

        star.x += vx;
        star.y += vy;

        const tailX = star.x - Math.cos(star.angle) * star.length;
        const tailY = star.y - Math.sin(star.angle) * star.length;

        const grad = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
        grad.addColorStop(0, star.color);
        grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.35)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

        ctx.save();
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = star.thickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glowing star head
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.thickness + 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = star.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();

        // Respawn at top of sky when it exits screen
        if (star.y > height + 120 || star.x > width + 150) {
          fallingStars[i] = createFallingStar(false);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
