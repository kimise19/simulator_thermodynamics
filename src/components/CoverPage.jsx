import React from 'react';
import EspeLogo from './EspeLogo';
import thermoImg from '../assets/thermo_illustration.png';

export default function CoverPage({ 
  studentName, 
  setStudentName, 
  professorName, 
  setProfessorName, 
  careerName, 
  setCareerName, 
  onStart 
}) {
  return (
    <div className="cover-wrapper container">
      {/* Cover Header */}
      <header className="cover-header">
        <div className="espe-header-logo-container">
          <EspeLogo size={65} />
          <div className="espe-title-section">
            <h1>Universidad de las Fuerzas Armadas ESPE</h1>
            <p>DEPARTAMENTO DE CIENCIAS EXACTAS</p>
          </div>
        </div>
        <div className="no-print" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Termodinámica - Primer Ley
        </div>
      </header>

      {/* Cover Body */}
      <main className="cover-body">
        {/* Left Side: Project details and student form */}
        <div className="cover-info-card">
          <span className="project-badge">PROYECTO DE FIN DE UNIDAD</span>
          <h2 className="project-title">
            Simulador Interactivo de la Primera Ley de la Termodinámica
          </h2>
          <p className="project-subtitle">
            Un laboratorio virtual interactivo diseñado para el estudio, cálculo y visualización gráfica de los procesos termodinámicos fundamentales en gases ideales (Isotérmico, Isobárico, Isocórico y Adiabático).
          </p>

          {/* Student metadata form (Interactive & committable to PDF) */}
          <div className="metadata-grid">
            <div className="metadata-item">
              <label>Integrantes</label>
              <input 
                type="text" 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Integrantes del Grupo"
                className="input-field"
                style={{ 
                  borderBottom: '2px solid var(--border-color)', 
                  borderTop: 'none', 
                  borderLeft: 'none', 
                  borderRight: 'none', 
                  borderRadius: 0,
                  padding: '4px 0',
                  fontWeight: 600,
                  fontSize: '1rem',
                  backgroundColor: 'transparent'
                }}
              />
            </div>
            <div className="metadata-item">
              <label>Docente</label>
              <input 
                type="text" 
                value={professorName}
                onChange={(e) => setProfessorName(e.target.value)}
                placeholder="Nombre del Docente"
                className="input-field"
                style={{ 
                  borderBottom: '2px solid var(--border-color)', 
                  borderTop: 'none', 
                  borderLeft: 'none', 
                  borderRight: 'none', 
                  borderRadius: 0,
                  padding: '4px 0',
                  fontWeight: 600,
                  fontSize: '1rem',
                  backgroundColor: 'transparent'
                }}
              />
            </div>
            <div className="metadata-item">
              <label>Carrera</label>
              <input 
                type="text" 
                value={careerName}
                onChange={(e) => setCareerName(e.target.value)}
                placeholder="Carrera Universitaria"
                className="input-field"
                style={{ 
                  borderBottom: '2px solid var(--border-color)', 
                  borderTop: 'none', 
                  borderLeft: 'none', 
                  borderRight: 'none', 
                  borderRadius: 0,
                  padding: '4px 0',
                  fontWeight: 600,
                  fontSize: '1rem',
                  backgroundColor: 'transparent'
                }}
              />
            </div>
            <div className="metadata-item">
              <label>Asignatura</label>
              <span style={{ display: 'block', paddingTop: '4px', fontSize: '1rem', fontWeight: 600 }}>
                Física de la Termodinámica
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }} className="no-print">
            <button className="btn btn-primary btn-gold" onClick={onStart} style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
              Ingresar al Laboratorio Virtual
            </button>
          </div>
        </div>

        {/* Right Side: Thermo illustration */}
        <div className="cover-image-container">
          <div className="thermo-graphic-card" style={{ padding: 0 }}>
            <img 
              src={thermoImg} 
              alt="Ilustración Termodinámica ESPE" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                borderRadius: '30px', 
                position: 'relative', 
                zIndex: 2,
                display: 'block'
              }}
            />
          </div>
        </div>
      </main>

      {/* Cover Footer */}
      <footer className="cover-footer">
        <p>© 2026 Universidad de las Fuerzas Armadas ESPE. Sangolquí, Ecuador.</p>
      </footer>
    </div>
  );
}
