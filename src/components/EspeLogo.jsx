import React from 'react';

export default function EspeLogo({ size = 80, className = "" }) {
  return (
    <img 
      src="/ESPEtransparente.png" 
      alt="Logo ESPE" 
      width={size} 
      height={size} 
      className={className}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}
