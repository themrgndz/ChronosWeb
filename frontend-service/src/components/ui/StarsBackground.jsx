import React, { useRef, useEffect } from 'react';

const StarsBackground = ({ starCount = 400 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    const stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speedAlpha: (Math.random() * 0.02) + 0.005,
        speedY: Math.random() * 0.3 + 0.05,
      });
    }

    const render = () => {
      // Very dark space color with slight transparency to allow trailing effect if desired
      // Using clearRect instead to keep it sharp
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach((star) => {
        // Twinkling effect
        star.alpha += star.speedAlpha;
        if (star.alpha >= 1 || star.alpha <= 0.1) {
          star.speedAlpha = -star.speedAlpha;
        }

        // Slight upward movement
        star.y -= star.speedY;
        if (star.y < 0) {
          star.y = canvas.height;
          star.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        // Sometimes draw a slightly bluish or yellowish star
        const colorVariant = Math.random();
        if(colorVariant > 0.95) ctx.fillStyle = `rgba(147, 197, 253, ${star.alpha})`; // Light blue
        else if(colorVariant > 0.90) ctx.fillStyle = `rgba(253, 230, 138, ${star.alpha})`; // Light yellow
        else ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [starCount]);

  return (
    <div className="fixed inset-0 z-0 bg-[#05070f] overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* Deep space radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)]"></div>
    </div>
  );
};

export default StarsBackground;
