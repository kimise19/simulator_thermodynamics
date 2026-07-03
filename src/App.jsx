import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip as ChartTooltip, Legend as ChartLegend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
// react-icons removed

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Internal modules
import EspeLogo from './components/EspeLogo';
import CoverPage from './components/CoverPage';
import MathFormula from './components/MathFormula';
import HelpTooltip from './components/HelpTooltip';
import PistonAnimation from './components/PistonAnimation';
import { 
  calculateSimulation, 
  generateProcessCurve, 
  convertPressure, 
  convertVolume, 
  convertTemp,
  R
} from './utils/thermo';

// Register Chart.js elements
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  ChartLegend,
  Filler
);

export default function App() {
  // Theme & screen navigation state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [screen, setScreen] = useState('simulator');

  // Student Cover Metadata
  const [studentName, setStudentName] = useState(() => localStorage.getItem('studentName') || '');
  const [professorName, setProfessorName] = useState(() => localStorage.getItem('professorName') || '');
  const [careerName, setCareerName] = useState(() => localStorage.getItem('careerName') || '');

  // Simulation variables state
  const [process, setProcess] = useState('isotermico');
  const [n, setN] = useState('1.0');
  const [gamma, setGamma] = useState('1.4');
  
  // Dynamic inputs based on selected process
  const [Ti, setTi] = useState('25'); // °C
  const [Pi, setPi] = useState('100'); // kPa
  const [Pf, setPf] = useState('200'); // kPa
  const [Vi, setVi] = useState('10');  // L
  const [Vf, setVf] = useState('20');  // L

  // Unit selections
  const [unitP, setUnitP] = useState('kPa');
  const [unitV, setUnitV] = useState('L');
  const [unitT, setUnitT] = useState('C');

  // Simulator Engine States
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('sim_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Animation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const [animVol, setAnimVol] = useState(1.0);
  const [animTemp, setAnimTemp] = useState(300);

  // References
  const chartRef = useRef(null);
  const reportRef = useRef(null);

  // Persistence of theme & cover metadata
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('studentName', studentName);
  }, [studentName]);

  useEffect(() => {
    localStorage.setItem('professorName', professorName);
  }, [professorName]);

  useEffect(() => {
    localStorage.setItem('careerName', careerName);
  }, [careerName]);

  useEffect(() => {
    localStorage.setItem('sim_history', JSON.stringify(history));
  }, [history]);

  // Handle process change - reset inputs to reasonable defaults
  const handleProcessChange = (proc) => {
    setProcess(proc);
    setErrors({});
    setResults(null);
    
    // Provide nice physical defaults for each process to make it easy to play with
    if (proc === 'isotermico') {
      setTi('25');
      setVi('10');
      setVf('20');
    } else if (proc === 'isobarico') {
      setPi('100');
      setVi('10');
      setVf('25');
    } else if (proc === 'isocorico') {
      setVi('15');
      setPi('100');
      setPf('220');
    } else if (proc === 'adiabatico') {
      setPi('120');
      setVi('10');
      setVf('22');
      setGamma('1.4');
    }
  };

  // Input validation
  const validate = () => {
    const newErrors = {};
    const nVal = parseFloat(n);
    const gammaVal = parseFloat(gamma);

    if (isNaN(nVal) || nVal <= 0) newErrors.n = "Los moles deben ser > 0";
    if (process === 'adiabatico') {
      if (isNaN(gammaVal) || gammaVal <= 1 || gammaVal > 2) {
        newErrors.gamma = "γ debe estar entre 1.01 y 2.0";
      }
    }

    if (process === 'isotermico') {
      const TiVal = parseFloat(Ti);
      const ViVal = parseFloat(Vi);
      const VfVal = parseFloat(Vf);
      
      if (isNaN(TiVal) || (unitT === 'C' && TiVal < -273.15) || (unitT === 'K' && TiVal <= 0)) {
        newErrors.Ti = "Temperatura no válida (> 0 K)";
      }
      if (isNaN(ViVal) || ViVal <= 0) newErrors.Vi = "Volumen debe ser > 0";
      if (isNaN(VfVal) || VfVal <= 0) newErrors.Vf = "Volumen debe ser > 0";
      if (ViVal === VfVal) newErrors.Vf = "Volumen final debe diferir del inicial";
    }

    if (process === 'isobarico') {
      const PiVal = parseFloat(Pi);
      const ViVal = parseFloat(Vi);
      const VfVal = parseFloat(Vf);

      if (isNaN(PiVal) || PiVal <= 0) newErrors.Pi = "Presión debe ser > 0";
      if (isNaN(ViVal) || ViVal <= 0) newErrors.Vi = "Volumen debe ser > 0";
      if (isNaN(VfVal) || VfVal <= 0) newErrors.Vf = "Volumen debe ser > 0";
      if (ViVal === VfVal) newErrors.Vf = "Volumen final debe diferir del inicial";
    }

    if (process === 'isocorico') {
      const ViVal = parseFloat(Vi);
      const PiVal = parseFloat(Pi);
      const PfVal = parseFloat(Pf);

      if (isNaN(ViVal) || ViVal <= 0) newErrors.Vi = "Volumen debe ser > 0";
      if (isNaN(PiVal) || PiVal <= 0) newErrors.Pi = "Presión debe ser > 0";
      if (isNaN(PfVal) || PfVal <= 0) newErrors.Pf = "Presión debe ser > 0";
      if (PiVal === PfVal) newErrors.Pf = "Presión final debe diferir de la inicial";
    }

    if (process === 'adiabatico') {
      const PiVal = parseFloat(Pi);
      const ViVal = parseFloat(Vi);
      const VfVal = parseFloat(Vf);

      if (isNaN(PiVal) || PiVal <= 0) newErrors.Pi = "Presión debe ser > 0";
      if (isNaN(ViVal) || ViVal <= 0) newErrors.Vi = "Volumen debe ser > 0";
      if (isNaN(VfVal) || VfVal <= 0) newErrors.Vf = "Volumen debe ser > 0";
      if (ViVal === VfVal) newErrors.Vf = "Volumen final debe diferir del inicial";
    }

    // Dry run simulation to test physical realism
    if (Object.keys(newErrors).length === 0) {
      try {
        const inputs = { n, gamma, Ti, Pi, Pf, Vi, Vf, unitP, unitV, unitT };
        const simResults = calculateSimulation(process, inputs);
        const tempLimitMin = 10; // K
        const tempLimitMax = 10000; // K

        if (simResults.Ti < tempLimitMin || simResults.Tf < tempLimitMin) {
          const tVal = Math.min(simResults.Ti, simResults.Tf);
          newErrors.general = `ERROR FÍSICO: La temperatura inicial (${convertTemp.fromSI(simResults.Ti, unitT).toFixed(1)}°${unitT}) o final (${convertTemp.fromSI(simResults.Tf, unitT).toFixed(1)}°${unitT}) es cercana al cero absoluto (menor a 10 K). El gas real se licuaría. Reduzca la presión/volumen o aumente la cantidad de moles.`;
        }
        if (simResults.Ti > tempLimitMax || simResults.Tf > tempLimitMax) {
          const tVal = Math.max(simResults.Ti, simResults.Tf);
          newErrors.general = `ERROR FÍSICO: La temperatura resultante (${convertTemp.fromSI(tVal, unitT).toFixed(0)}°${unitT}) supera los 10,000 K. El gas se ionizaría en plasma, perdiendo su comportamiento ideal. Aumente los moles o reduzca la presión/volumen.`;
        }
      } catch (e) {
        newErrors.general = "Error en el cálculo de estados termodinámicos.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Run physical simulation with visual transition
  const handleSimulate = () => {
    if (!validate()) return;

    // Collect all inputs
    const inputs = { n, gamma, Ti, Pi, Pf, Vi, Vf, unitP, unitV, unitT };

    // Calculate thermodynamic results
    const simResults = calculateSimulation(process, inputs);

    // Initial states for animation (in SI)
    const startV = simResults.Vi;
    const endV = simResults.Vf;
    const startT = simResults.Ti;
    const endT = simResults.Tf;

    setIsSimulating(true);
    setResults(null); // Hide outcomes while animating

    // Animation transition
    const duration = 1500; // ms
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      setAnimProgress(progress);

      // Smooth step interpolation
      const currentV = startV + (endV - startV) * progress;
      const currentT = startT + (endT - startT) * progress;

      setAnimVol(convertVolume.fromSI(currentV, unitV));
      setAnimTemp(currentT);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Complete animation, display final results cards & store in history
        setResults(simResults);
        setIsSimulating(false);

        // Append to history log
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const historyItem = {
          id: Date.now(),
          process,
          timestamp,
          inputs: { ...inputs },
          results: {
            W: simResults.W,
            Q: simResults.Q,
            deltaU: simResults.deltaU,
            Pf: convertPressure.fromSI(simResults.Pf, unitP),
            Vf: convertVolume.fromSI(simResults.Vf, unitV),
            Tf: convertTemp.fromSI(simResults.Tf, unitT)
          }
        };
        setHistory(prev => [historyItem, ...prev.slice(0, 9)]); // limit history to 10
      }
    };

    requestAnimationFrame(animate);
  };

  // Reset simulator
  const handleReset = () => {
    setResults(null);
    setErrors({});
    setIsSimulating(false);
    handleProcessChange(process);
  };

  // Load past simulation
  const loadHistoryItem = (item) => {
    setProcess(item.process);
    setN(item.inputs.n);
    setGamma(item.inputs.gamma);
    setTi(item.inputs.Ti);
    setPi(item.inputs.Pi);
    setPf(item.inputs.Pf);
    setVi(item.inputs.Vi);
    setVf(item.inputs.Vf);
    setUnitP(item.inputs.unitP);
    setUnitV(item.inputs.unitV);
    setUnitT(item.inputs.unitT);

    // Instant calculations loading
    const recalculated = calculateSimulation(item.process, item.inputs);
    setResults(recalculated);
  };

  // Download chart as PNG
  const downloadChart = () => {
    const chart = chartRef.current;
    if (chart) {
      const link = document.createElement('a');
      link.download = `grafico_PV_${process}.png`;
      link.href = chart.toBase64Image();
      link.click();
    }
  };

  // PDF report export
  const exportPDF = async () => {
    const reportElem = reportRef.current;
    if (!reportElem) return;

    // Show temporary loader
    const originalStyle = reportElem.style.display;
    reportElem.style.display = 'block'; // Make it visible briefly for rendering

    try {
      const canvas = await html2canvas(reportElem, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 295; // A4 page height in mm (slightly less than 297 to prevent extra blank page)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Page 1
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Page 2 and subsequent pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Reporte_Termodinamica_ESPE_${process}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      reportElem.style.display = originalStyle;
    }
  };

  // Build chart dataset
  let chartData = null;
  let chartOptions = null;

  if (results || isSimulating) {
    // Current simulation context to show
    const currentSim = results 
      ? { ...results, gamma: parseFloat(gamma) }
      : {
          Vi: convertVolume.toSI(parseFloat(Vi), unitV),
          Vf: convertVolume.toSI(parseFloat(Vf), unitV),
          Pi: convertPressure.toSI(parseFloat(Pi), unitP),
          Pf: convertPressure.toSI(parseFloat(Pi), unitP), // fallback
          Ti: convertTemp.toSI(parseFloat(Ti), unitT),
          Tf: convertTemp.toSI(parseFloat(Ti), unitT),
          gamma: parseFloat(gamma)
        };

    const curvePoints = generateProcessCurve(process, currentSim);

    // Map points to selected units for plotting consistency
    const plottedCurve = curvePoints.map(pt => ({
      x: convertVolume.fromSI(pt.x, unitV),
      y: convertPressure.fromSI(pt.y, unitP)
    }));

    const isLight = theme === 'light';
    const gridColor = isLight ? '#E2E8F0' : '#1E293B';
    const textColor = isLight ? '#1F2937' : '#F3F4F6';

    chartData = {
      datasets: [
        {
          label: 'Curva de Proceso',
          data: plottedCurve,
          borderColor: '#006935',
          backgroundColor: isLight ? 'rgba(0, 105, 53, 0.05)' : 'rgba(0, 105, 53, 0.15)',
          borderWidth: 3.5,
          fill: true,
          pointRadius: 0,
          tension: 0.1,
          showLine: true
        },
        {
          label: 'Estado A (Inicial)',
          data: [{ 
            x: convertVolume.fromSI(currentSim.Vi, unitV), 
            y: convertPressure.fromSI(currentSim.Pi, unitP) 
          }],
          pointBackgroundColor: '#D4AF37', // ESPE Gold
          pointBorderColor: '#002147',
          pointRadius: 7,
          pointHoverRadius: 9,
          showLine: false
        },
        {
          label: 'Estado B (Final)',
          data: [{ 
            x: convertVolume.fromSI(currentSim.Vf, unitV), 
            y: convertPressure.fromSI(currentSim.Pf, unitP) 
          }],
          pointBackgroundColor: '#16A34A', // Success Green
          pointBorderColor: '#002147',
          pointRadius: 7,
          pointHoverRadius: 9,
          showLine: false
        }
      ]
    };

    chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: { family: 'Outfit', size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `V: ${ctx.parsed.x.toFixed(3)} ${unitV}, P: ${ctx.parsed.y.toFixed(1)} ${unitP}`
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: `Volumen (V) [${unitV}]`,
            color: textColor,
            font: { family: 'Outfit', size: 12, weight: 'bold' }
          },
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'JetBrains Mono', size: 10 } }
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: `Presión (P) [${unitP}]`,
            color: textColor,
            font: { family: 'Outfit', size: 12, weight: 'bold' }
          },
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'JetBrains Mono', size: 10 } }
        }
      }
    };
  }

  // Cover Page Router
  if (screen === 'cover') {
    return (
      <CoverPage 
        studentName={studentName}
        setStudentName={setStudentName}
        professorName={professorName}
        setProfessorName={setProfessorName}
        careerName={careerName}
        setCareerName={setCareerName}
        onStart={() => setScreen('simulator')}
      />
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header Panel */}
      <header className="lab-header container no-print" style={{ width: '100%', maxWidth: '100%', margin: '0 0 1.5rem 0', borderRadius: '0 0 12px 12px' }}>
        <div className="lab-header-content">
          <div className="lab-logo-area" onClick={() => setScreen('cover')}>
            <EspeLogo size={42} />
            <div className="lab-logo-text">
              <h2>Laboratorio de Fisicoquímica</h2>
              <span>Termodinámica virtual</span>
            </div>
          </div>

        </div>
      </header>

      {/* Integrantes Section */}
      <section className="no-print" style={{ 
        backgroundColor: 'var(--bg-secondary)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '12px', 
        padding: '0.75rem 1.25rem', 
        marginBottom: '1rem',
        textAlign: 'left',
        fontSize: '0.9rem'
      }}>
        <span style={{ fontWeight: 600, color: 'var(--espe-green)', marginRight: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
          Integrantes:
        </span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          Castro Mathias, Mullo Martín, Tufiño Andrea, Villarruel Leonel
        </span>
      </section>

      {/* Intro Box */}
      <section className="intro-card no-print">
        <h3 className="intro-title">La Primera Ley de la Termodinámica</h3>
        <p className="intro-text">
          Establece que la energía no se crea ni se destruye, sino que se transforma. Para un sistema cerrado, 
          cualquier transferencia de calor (<MathFormula formula="Q" />) o trabajo mecánico (<MathFormula formula="W" />) 
          con el entorno produce una variación en la energía interna (<MathFormula formula="\Delta U" />) del sistema, 
          expresada como: <MathFormula formula="\Delta U = Q + W" />.
        </p>
      </section>

      {/* Main Lab Grid */}
      <div className="lab-grid">
        
        {/* Sidebar Inputs Controls (Left Panel) */}
        <aside className="card no-print">
          <div className="card-header">
            <h3 className="card-title">CONFIGURACIÓN</h3>
          </div>
          <div className="card-body">
            
            {/* Process Selection buttons */}
            <div className="process-selector-container">
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                PROCESO TERMODINÁMICO
              </label>
              {[
                { id: 'isotermico', label: 'Isotérmico (T = cte)' },
                { id: 'isobarico', label: 'Isobárico (P = cte)' },
                { id: 'isocorico', label: 'Isocórico (V = cte)' },
                { id: 'adiabatico', label: 'Adiabático (Q = 0)' }
              ].map(proc => (
                <button
                  key={proc.id}
                  type="button"
                  className={`process-btn ${process === proc.id ? 'active' : ''}`}
                  onClick={() => handleProcessChange(proc.id)}
                  disabled={isSimulating}
                >
                  {proc.label}
                </button>
              ))}
            </div>

            {/* General input params */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              
              {/* Unit Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <div className="label-container"><label>P [Presión]</label></div>
                  <select 
                    value={unitP} 
                    onChange={(e) => setUnitP(e.target.value)}
                    className="unit-select"
                    style={{ width: '100%', borderRadius: '6px', padding: '0.35rem', border: '1px solid var(--border-color)' }}
                  >
                    <option value="Pa">Pa</option>
                    <option value="kPa">kPa</option>
                    <option value="atm">atm</option>
                  </select>
                </div>
                <div className="form-group">
                  <div className="label-container"><label>V [Volumen]</label></div>
                  <select 
                    value={unitV} 
                    onChange={(e) => setUnitV(e.target.value)}
                    className="unit-select"
                    style={{ width: '100%', borderRadius: '6px', padding: '0.35rem', border: '1px solid var(--border-color)' }}
                  >
                    <option value="m3">m³</option>
                    <option value="L">Litros</option>
                  </select>
                </div>
                <div className="form-group">
                  <div className="label-container"><label>T [Temp]</label></div>
                  <select 
                    value={unitT} 
                    onChange={(e) => setUnitT(e.target.value)}
                    className="unit-select"
                    style={{ width: '100%', borderRadius: '6px', padding: '0.35rem', border: '1px solid var(--border-color)' }}
                  >
                    <option value="C">°C</option>
                    <option value="K">K</option>
                  </select>
                </div>
              </div>

              {/* Moles (n) */}
              <div className="form-group">
                <div className="label-container">
                  <label>Moles de Gas (n)</label>
                  <HelpTooltip text="Cantidad de gas ideal en moles. Define la escala y la capacidad térmica total del sistema." />
                </div>
                <div className="input-container">
                  <input 
                    type="number" 
                    step="0.1" 
                    value={n} 
                    onChange={(e) => setN(e.target.value)}
                    disabled={isSimulating}
                    className="input-field" 
                  />
                  <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>mol</span>
                </div>
                {errors.n && <span className="validation-error">{errors.n}</span>}
              </div>

              {/* Gamma (γ) */}
              {process === 'adiabatico' && (
                <div className="form-group">
                  <div className="label-container">
                    <label>Coeficiente Adiabático (γ)</label>
                    <HelpTooltip text="Relación de capacidades caloríficas (Cp/Cv). Monotómico = 1.67, Diatómico = 1.40." />
                  </div>
                  <div className="input-container">
                    <input 
                      type="number" 
                      step="0.01" 
                      value={gamma} 
                      onChange={(e) => setGamma(e.target.value)}
                      disabled={isSimulating}
                      className="input-field" 
                    />
                    <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>ratio</span>
                  </div>
                  {errors.gamma && <span className="validation-error">{errors.gamma}</span>}
                </div>
              )}

              {/* Isotérmico inputs */}
              {process === 'isotermico' && (
                <>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Temperatura (T = cte)</label>
                      <HelpTooltip text="Temperatura a la cual ocurre el proceso. Permanece constante." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Ti} 
                        onChange={(e) => setTi(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>°{unitT}</span>
                    </div>
                    {errors.Ti && <span className="validation-error">{errors.Ti}</span>}
                  </div>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Volumen Inicial (Vi)</label>
                      <HelpTooltip text="Volumen del gas al inicio de la expansión o compresión." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Vi} 
                        onChange={(e) => setVi(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>{unitV}</span>
                    </div>
                    {errors.Vi && <span className="validation-error">{errors.Vi}</span>}
                  </div>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Volumen Final (Vf)</label>
                      <HelpTooltip text="Volumen final alcanzado por el gas." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Vf} 
                        onChange={(e) => setVf(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>{unitV}</span>
                    </div>
                    {errors.Vf && <span className="validation-error">{errors.Vf}</span>}
                  </div>
                </>
              )}

              {/* Isobárico inputs */}
              {process === 'isobarico' && (
                <>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Presión (P = cte)</label>
                      <HelpTooltip text="Presión del sistema que se mantendrá fija durante el desplazamiento." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Pi} 
                        onChange={(e) => setPi(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>{unitP}</span>
                    </div>
                    {errors.Pi && <span className="validation-error">{errors.Pi}</span>}
                  </div>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Volumen Inicial (Vi)</label>
                      <HelpTooltip text="Volumen al comienzo de la expansión/compresión." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Vi} 
                        onChange={(e) => setVi(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>{unitV}</span>
                    </div>
                    {errors.Vi && <span className="validation-error">{errors.Vi}</span>}
                  </div>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Volumen Final (Vf)</label>
                      <HelpTooltip text="Volumen de destino del gas." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Vf} 
                        onChange={(e) => setVf(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>{unitV}</span>
                    </div>
                    {errors.Vf && <span className="validation-error">{errors.Vf}</span>}
                  </div>
                </>
              )}

              {/* Isocórico inputs */}
              {process === 'isocorico' && (
                <>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Volumen (V = cte)</label>
                      <HelpTooltip text="Volumen constante del recipiente sellado." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Vi} 
                        onChange={(e) => setVi(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>{unitV}</span>
                    </div>
                    {errors.Vi && <span className="validation-error">{errors.Vi}</span>}
                  </div>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Presión Inicial (Pi)</label>
                      <HelpTooltip text="Presión del gas antes del calentamiento/enfriamiento." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Pi} 
                        onChange={(e) => setPi(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>{unitP}</span>
                    </div>
                    {errors.Pi && <span className="validation-error">{errors.Pi}</span>}
                  </div>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Presión Final (Pf)</label>
                      <HelpTooltip text="Presión final del gas alcanzada tras la transferencia de calor." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Pf} 
                        onChange={(e) => setPf(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>{unitP}</span>
                    </div>
                    {errors.Pf && <span className="validation-error">{errors.Pf}</span>}
                  </div>
                </>
              )}

              {/* Adiabático inputs */}
              {process === 'adiabatico' && (
                <>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Presión Inicial (Pi)</label>
                      <HelpTooltip text="Presión al comienzo del proceso adiabático." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Pi} 
                        onChange={(e) => setPi(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>{unitP}</span>
                    </div>
                    {errors.Pi && <span className="validation-error">{errors.Pi}</span>}
                  </div>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Volumen Inicial (Vi)</label>
                      <HelpTooltip text="Volumen del gas al inicio de la expansión o compresión adiabática." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Vi} 
                        onChange={(e) => setVi(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>{unitV}</span>
                    </div>
                    {errors.Vi && <span className="validation-error">{errors.Vi}</span>}
                  </div>
                  <div className="form-group">
                    <div className="label-container">
                      <label>Volumen Final (Vf)</label>
                      <HelpTooltip text="Volumen final tras el desplazamiento adiabático." />
                    </div>
                    <div className="input-container">
                      <input 
                        type="number" 
                        value={Vf} 
                        onChange={(e) => setVf(e.target.value)} 
                        disabled={isSimulating}
                        className="input-field" 
                      />
                      <span className="unit-select" style={{ display: 'flex', alignItems: 'center' }}>{unitV}</span>
                    </div>
                    {errors.Vf && <span className="validation-error">{errors.Vf}</span>}
                  </div>
                </>
              )}

              {/* Simulation triggers */}
              {errors.general && (
                <div style={{ 
                  color: 'var(--espe-red)', 
                  backgroundColor: 'rgba(227, 6, 19, 0.08)', 
                  border: '1px solid rgba(227, 6, 19, 0.2)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  lineHeight: '1.4',
                  marginBottom: '1rem'
                }}>
                  {errors.general}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  className={`btn btn-primary ${isSimulating ? 'loading' : ''}`}
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  style={{ width: '100%' }}
                >
                  {isSimulating ? 'Simulando...' : 'Ejecutar Simulación'}
                </button>
                {(results || isSimulating) && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleReset}
                    disabled={isSimulating}
                    style={{ width: '100%' }}
                  >
                    Reiniciar
                  </button>
                )}
              </div>

            </div>

          </div>
        </aside>

        {/* Center Laboratory Screen Area */}
        <main className="lab-workspace">
          
          {/* Top Panel: Piston Animation & Live plot side-by-side */}
          <section className="piston-chart-section">
            
            {/* Cylinder-Piston Simulator box */}
            <div className="card">
              <div className="card-body" style={{ padding: 0, height: '100%' }}>
                <PistonAnimation 
                  volume={isSimulating ? animVol : (results ? convertVolume.fromSI(results.Vf, unitV) : convertVolume.fromSI(convertVolume.toSI(parseFloat(Vi), unitV), unitV))}
                  minVolume={convertVolume.fromSI(convertVolume.toSI(0.1, 'L'), unitV)}
                  maxVolume={convertVolume.fromSI(convertVolume.toSI(40, 'L'), unitV)}
                  temperature={isSimulating ? animTemp : (results ? results.Tf : convertTemp.toSI(parseFloat(Ti), unitT))}
                  minTemp={100}
                  maxTemp={800}
                  heatTransferred={results ? results.Q : 0}
                  workDone={results ? results.W : 0}
                  isSimulating={isSimulating}
                  unitT={unitT}
                  unitV={unitV}
                />
              </div>
            </div>

            {/* P-V Plot Box */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">DIAGRAMA PRESIÓN - VOLUMEN (P-V)</h3>
                {(results || isSimulating) && (
                  <button 
                    onClick={downloadChart} 
                    className="btn btn-secondary no-print" 
                    style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                    title="Descargar gráfico como PNG"
                  >
                    Descargar PNG
                  </button>
                )}
              </div>
              <div className="card-body" style={{ height: '280px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {chartData ? (
                  <Line ref={chartRef} data={chartData} options={chartOptions} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>Ejecutá la simulación para visualizar la curva física del proceso en tiempo real.</p>
                  </div>
                )}
              </div>
            </div>

          </section>

          {/* Bottom Panel: Simulation Results Cards & Step-by-Step Math */}
          {results && (
            <>
              {/* Output variables cards grid */}
              <section className="results-grid">
                <div className="result-card work">
                  <span className="result-label">Trabajo (W)</span>
                  <span className="result-value">
                    {results.W.toFixed(1)}
                  </span>
                  <span className="result-unit">Joules (J)</span>
                </div>
                <div className="result-card heat">
                  <span className="result-label">Calor (Q)</span>
                  <span className="result-value">
                    {results.Q.toFixed(1)}
                  </span>
                  <span className="result-unit">Joules (J)</span>
                </div>
                <div className="result-card energy">
                  <span className="result-label">Energía Interna (ΔU)</span>
                  <span className="result-value">
                    {results.deltaU.toFixed(1)}
                  </span>
                  <span className="result-unit">Joules (J)</span>
                </div>
                <div className="result-card">
                  <span className="result-label">Presión Final (Pf)</span>
                  <span className="result-value">
                    {convertPressure.fromSI(results.Pf, unitP).toFixed(1)}
                  </span>
                  <span className="result-unit">{unitP}</span>
                </div>
                <div className="result-card">
                  <span className="result-label">Temp. Final (Tf)</span>
                  <span className="result-value">
                    {convertTemp.fromSI(results.Tf, unitT).toFixed(1)}
                  </span>
                  <span className="result-unit">°{unitT}</span>
                </div>
              </section>

              {/* Math Development & Physical Explanation Tabs */}
              <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
                
                {/* Math Step-by-Step Formulas */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">DESARROLLO MATEMÁTICO PASO A PASO</h3>
                  </div>
                  <div className="card-body">
                    <div className="math-steps-container">
                      {results.mathSteps.map((step, idx) => (
                        <div key={idx} className="math-step">
                          <h4 className="math-step-title">{step.title}</h4>
                          <p className="math-step-desc" style={{ marginBottom: '0.5rem' }}>{step.desc}</p>
                          <div className="formula-display">
                            <MathFormula formula={step.formula} displayMode={true} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Conceptual description, Variables table & Exports */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Conceptual Explanation text */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">EXPLICACIÓN FÍSICA</h3>
                    </div>
                    <div className="card-body">
                      <div className="conceptual-explanation">
                        <p>{results.explanation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Variables comparison table */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">VARIABLES DE ESTADO</h3>
                    </div>
                    <div className="card-body" style={{ padding: '0.75rem' }}>
                      <div className="table-container">
                        <table className="comparison-table">
                          <thead>
                            <tr>
                              <th>Variable</th>
                              <th>Estado A (Inicial)</th>
                              <th>Estado B (Final)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="var-name">Presión (P)</td>
                              <td className="var-val">{convertPressure.fromSI(results.Pi, unitP).toFixed(2)} {unitP}</td>
                              <td className="var-val">{convertPressure.fromSI(results.Pf, unitP).toFixed(2)} {unitP}</td>
                            </tr>
                            <tr>
                              <td className="var-name">Volumen (V)</td>
                              <td className="var-val">{convertVolume.fromSI(results.Vi, unitV).toFixed(3)} {unitV}</td>
                              <td className="var-val">{convertVolume.fromSI(results.Vf, unitV).toFixed(3)} {unitV}</td>
                            </tr>
                            <tr>
                              <td className="var-name">Temperatura (T)</td>
                              <td className="var-val">{convertTemp.fromSI(results.Ti, unitT).toFixed(1)} °{unitT}</td>
                              <td className="var-val">{convertTemp.fromSI(results.Tf, unitT).toFixed(1)} °{unitT}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Export buttons row */}
                      <div className="action-row no-print">
                        <button className="btn btn-primary" onClick={exportPDF}>
                          Exportar Reporte (PDF)
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </section>
            </>
          )}

          {/* History / Simulation log */}
          <section className="card no-print">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">HISTORIAL DE SIMULACIONES</h3>
              {history.length > 0 && (
                <button 
                  onClick={() => setHistory([])}
                  className="btn btn-danger" 
                  style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', gap: '4px' }}
                >
                  Borrar Historial
                </button>
              )}
            </div>
            <div className="card-body">
              {history.length > 0 ? (
                <div className="history-list">
                  {history.map((item) => (
                    <div 
                      key={item.id} 
                      className="history-item"
                      onClick={() => loadHistoryItem(item)}
                    >
                      <div className="history-item-header">
                        <span className="history-item-process">{item.process}</span>
                        <span className="history-item-time">{item.timestamp}</span>
                      </div>
                      <div className="history-item-summary">
                        <span>W: {item.results.W.toFixed(0)} J</span>
                        <span>Q: {item.results.Q.toFixed(0)} J</span>
                        <span>ΔU: {item.results.deltaU.toFixed(0)} J</span>
                        <span style={{ color: 'var(--espe-gold)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          Cargar
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="history-empty">El historial está vacío. Ejecutá una simulación para registrarla.</p>
              )}
            </div>
          </section>

        </main>
      </div>

      {/* Hidden Print Report Container (Optimized for PDF Export) */}
      <div 
        ref={reportRef} 
        style={{ 
          display: 'none', 
          width: '780px', 
          backgroundColor: '#FFFFFF', 
          color: '#1F2937', 
          padding: '40px',
          fontFamily: 'Outfit, sans-serif'
        }}
      >
        {/* ESPE Institutional header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '3px solid #D4AF37', paddingBottom: '15px', marginBottom: '25px' }}>
          <EspeLogo size={60} />
          <div>
            <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: '#006935' }}>Universidad de las Fuerzas Armadas ESPE</h1>
            <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#6B7280', letterSpacing: '1px', fontWeight: 'bold' }}>DEPARTAMENTO DE CIENCIAS EXACTAS</p>
          </div>
        </div>

        {/* Academic metadata */}
        <div style={{ backgroundColor: '#F3F4F6', borderRadius: '12px', padding: '20px', marginBottom: '25px', fontSize: '13px' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#006935', borderBottom: '1px solid #D9E1E8', paddingBottom: '6px' }}>Reporte de Laboratorio Virtual</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
            <div><strong>Proyecto:</strong> Simulador de la Primera Ley de la Termodinámica</div>
            <div><strong>Asignatura:</strong> Físico-química</div>
            <div><strong>Integrantes:</strong> Castro Mathias, Mullo Martín, Tufiño Andrea, Villarruel Leonel</div>
            <div><strong>Docente:</strong> Ing. Raquel Zúñiga MsC.</div>
            <div><strong>Carrera:</strong> Ingeniería en Biotecnología</div>
            <div><strong>Fecha:</strong> {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {results && (
          <div>
            {/* Simulation settings & results summary */}
            <div style={{ display: 'flex', gap: '25px', marginBottom: '25px' }}>
              <div style={{ flex: 1, border: '1px solid #D9E1E8', borderRadius: '10px', padding: '15px' }}>
                <h3 style={{ fontSize: '14px', color: '#006935', margin: '0 0 10px 0', borderBottom: '1px solid #D9E1E8', paddingBottom: '4px' }}>Configuración del Proceso: <span style={{ textTransform: 'uppercase', color: '#006935' }}>{process}</span></h3>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}><td style={{ padding: '6px 0' }}>Moles (n)</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{n} mol</td></tr>
                    {process === 'adiabatico' && (
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}><td style={{ padding: '6px 0' }}>Coef. Adiabático (γ)</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{gamma}</td></tr>
                    )}
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}><td style={{ padding: '6px 0' }}>Presión Inicial</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{convertPressure.fromSI(results.Pi, unitP).toFixed(2)} {unitP}</td></tr>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}><td style={{ padding: '6px 0' }}>Volumen Inicial</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{convertVolume.fromSI(results.Vi, unitV).toFixed(3)} {unitV}</td></tr>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}><td style={{ padding: '6px 0' }}>Temp. Inicial</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{convertTemp.fromSI(results.Ti, unitT).toFixed(1)} °{unitT}</td></tr>
                  </tbody>
                </table>
              </div>

              <div style={{ flex: 1, border: '1px solid #D9E1E8', borderRadius: '10px', padding: '15px' }}>
                <h3 style={{ fontSize: '14px', color: '#006935', margin: '0 0 10px 0', borderBottom: '1px solid #D9E1E8', paddingBottom: '4px' }}>Variables Finales del Estado B</h3>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}><td style={{ padding: '6px 0' }}>Presión Final (Pf)</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{convertPressure.fromSI(results.Pf, unitP).toFixed(2)} {unitP}</td></tr>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}><td style={{ padding: '6px 0' }}>Volumen Final (Vf)</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{convertVolume.fromSI(results.Vf, unitV).toFixed(3)} {unitV}</td></tr>
                    <tr style={{ borderBottom: '1px solid #F3F4F6' }}><td style={{ padding: '6px 0' }}>Temp. Final (Tf)</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{convertTemp.fromSI(results.Tf, unitT).toFixed(1)} °{unitT}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* First law calculations summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
              <div style={{ borderLeft: '4px solid #006935', padding: '10px', backgroundColor: '#F3F4F6' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Trabajo Realizado (W)</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>{results.W.toFixed(1)} J</div>
              </div>
              <div style={{ borderLeft: '4px solid #EA580C', padding: '10px', backgroundColor: '#F3F4F6' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Calor Transferido (Q)</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>{results.Q.toFixed(1)} J</div>
              </div>
              <div style={{ borderLeft: '4px solid #D4AF37', padding: '10px', backgroundColor: '#F3F4F6' }}>
                <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Cambio Energía (ΔU)</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937' }}>{results.deltaU.toFixed(1)} J</div>
              </div>
            </div>

            {/* Explanation box */}
            <div style={{ border: '1px solid #006935', borderRadius: '10px', padding: '15px', marginBottom: '25px', backgroundColor: 'rgba(0, 105, 53, 0.02)', fontSize: '12px', lineHeight: '1.5' }}>
              <h4 style={{ margin: '0 0 6px 0', color: '#006935', fontSize: '13px' }}>Análisis del Comportamiento Físico:</h4>
              <p style={{ margin: 0 }}>{results.explanation}</p>
            </div>

            {/* Mathematical formulas derivation */}
            <div style={{ border: '1px solid #D9E1E8', borderRadius: '10px', padding: '15px', fontSize: '12px' }}>
              <h3 style={{ fontSize: '14px', color: '#006935', margin: '0 0 10px 0', borderBottom: '1px solid #D9E1E8', paddingBottom: '4px' }}>Cálculos Matemáticos Paso a Paso:</h3>
              {results.mathSteps.map((step, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#006935', fontSize: '12px' }}>{step.title}</strong>
                  <p style={{ margin: '2px 0 6px 0', color: '#6B7280' }}>{step.desc}</p>
                  <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px', textAlign: 'center' }}>
                    <MathFormula formula={step.formula} displayMode={true} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
