import React, { useEffect, useRef } from 'react';

export default function PistonAnimation({ 
  volume = 1,      // Current volume in normalized units or raw
  minVolume = 0.5,
  maxVolume = 2.0,
  temperature = 300, // in Kelvin
  minTemp = 100,
  maxTemp = 600,
  heatTransferred = 0, // Q, determines if flame/ice is active
  workDone = 0,         // W, determines piston direction arrow
  isSimulating = false,
  unitT = 'K',
  unitV = 'm³'
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  // Calculate piston position (percentage from bottom of cylinder)
  // Let's cap the volume to range
  const volPct = Math.max(0.15, Math.min(0.9, (volume - minVolume * 0.5) / (maxVolume * 1.2 - minVolume * 0.5)));
  const chamberHeight = 180; // height of the chamber in px
  const gasHeight = chamberHeight * volPct;
  const pistonBottomY = gasHeight; // height of gas from the bottom

  // Temperature color styling (from blue to red)
  const getTempColor = (t) => {
    const minT = minTemp || 100;
    const maxT = maxTemp || 600;
    const ratio = Math.max(0, Math.min(1, (t - minT) / (maxT - minT)));
    // Interpolate between cold blue (120, 180, 255) and hot red (255, 80, 80)
    const r = Math.round(100 + ratio * 155);
    const g = Math.round(150 - ratio * 100);
    const b = Math.round(255 - ratio * 175);
    return `rgba(${r}, ${g}, ${b}, 0.25)`;
  };

  // Particles animation inside the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set internal resolution
    const width = 130;
    canvas.width = width;
    
    // Initialize particles if empty
    const particleCount = 25;
    if (particlesRef.current.length === 0) {
      const particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * (width - 12) + 6,
          y: Math.random() * (gasHeight - 12) + 6,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 3
        });
      }
      particlesRef.current = particles;
    }

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update canvas height to match active gas height
      const height = Math.max(20, gasHeight);
      canvas.height = height;

      // Adjust particle speeds based on temperature
      // Reference temp is 300K, speed multiplier is sqrt(T / 300)
      const speedMultiplier = Math.sqrt(temperature / 300) * 1.5;

      particlesRef.current.forEach(p => {
        // Move particle
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Wall collision (X)
        if (p.x - p.radius < 0) {
          p.x = p.radius;
          p.vx = -p.vx;
        } else if (p.x + p.radius > width) {
          p.x = width - p.radius;
          p.vx = -p.vx;
        }

        // Piston/bottom collision (Y)
        // Y coordinate runs from 0 (top of gas chamber = piston head) to gasHeight (bottom of cylinder)
        if (p.y - p.radius < 0) {
          p.y = p.radius;
          p.vy = -p.vy;
        } else if (p.y + p.radius > height) {
          p.y = height - p.radius;
          p.vy = -p.vy;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#D4AF37'; // ESPE Gold particles
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#D4AF37';
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gasHeight, temperature]);

  return (
    <div className="piston-visualizer">
      {/* Title */}
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        COMPORTAMIENTO DEL SISTEMA
      </h3>

      {/* Contenedor relativo del cilindro y fuentes de temperatura */}
      <div style={{ position: 'relative', margin: '1rem 0' }}>
        {/* Piston & Cylinder chamber */}
        <div className="piston-chamber">
          {/* Piston Shaft (moves with volume) */}
          <div 
            className="piston-shaft" 
            style={{ 
              height: `${200 - pistonBottomY}px`,
              bottom: `${pistonBottomY + 15}px` 
            }} 
          />
          
          {/* Piston Head */}
          <div 
            className="piston-head" 
            style={{ 
              bottom: `${pistonBottomY}px` 
            }} 
          >
            {workDone > 0.01 && (
              <span style={{ color: 'var(--white)', fontSize: '10px', display: 'block', textAlign: 'center', fontWeight: 'bold' }}>W &gt; 0</span>
            )}
            {workDone < -0.01 && (
              <span style={{ color: 'var(--white)', fontSize: '10px', display: 'block', textAlign: 'center', fontWeight: 'bold' }}>W &lt; 0</span>
            )}
          </div>

          {/* Gas Chamber / Canvas Container */}
          <div 
            className="gas-chamber" 
            style={{ 
              height: `${pistonBottomY}px`,
              backgroundColor: getTempColor(temperature)
            }}
          >
            <canvas 
              ref={canvasRef} 
              style={{ 
                position: 'absolute', 
                left: 0, 
                bottom: 0, 
                width: '100%', 
                height: '100%',
                display: 'block' 
              }} 
            />
          </div>
        </div>

        {/* Heat Source (Flame) */}
        <div className={`heat-source ${heatTransferred > 1 ? 'active' : ''}`} style={{ position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <div className="flame"></div>
          <div className="flame"></div>
          <div className="flame"></div>
        </div>

        {/* Cooling Source (Ice Cubes) */}
        <div className={`cooling-source ${heatTransferred < -1 ? 'active' : ''}`} style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <div className="ice-cube"></div>
          <div className="ice-cube"></div>
          <div className="ice-cube"></div>
        </div>
      </div>

      {/* Status Info */}
      {(() => {
        const displayTemp = unitT === 'C' ? temperature - 273.15 : temperature;
        return (
          <div className="indicator-badge" style={{ marginTop: '2rem' }}>
            <span>T: <strong>{displayTemp.toFixed(1)} °{unitT}</strong></span>
            <span>|</span>
            <span>V: <strong>{volume.toFixed(volume < 1 ? 4 : 2)} {unitV}</strong></span>
          </div>
        );
      })()}
    </div>
  );
}
