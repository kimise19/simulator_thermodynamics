import React from 'react';
import logoImg from '/ESPEtransparente.png';

export default function EspeLogo({ size = 80, className = "" }) {
  return (
    <img 
      src={logoImg} 
      alt="Logo ESPE" 
      width={size} 
      height={size} 
      className={className}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}
