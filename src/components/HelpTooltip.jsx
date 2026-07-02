import React, { useState } from 'react';

export default function HelpTooltip({ text }) {
  const [visible, setVisible] = useState(false);

  return (
    <div 
      className="tooltip-container" 
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <button 
        type="button"
        className="tooltip-trigger"
        style={{ 
          border: 'none', 
          background: 'var(--bg-tertiary)', 
          color: 'var(--text-secondary)',
          borderRadius: '50%',
          width: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
          cursor: 'help'
        }}
        aria-label="Ayuda contextual"
      >
        ?
      </button>
      {visible && (
        <div className="tooltip-box">
          {text}
        </div>
      )}
    </div>
  );
}
