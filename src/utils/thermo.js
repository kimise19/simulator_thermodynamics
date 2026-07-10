// CONSTANTS
export const R = 8.314462618; // J / (mol * K)

// UNIT CONVERSIONS
export const convertPressure = {
  toSI: (val, unit) => {
    switch (unit) {
      case 'kPa': return val * 1000;
      case 'atm': return val * 101325;
      case 'Pa':
      default: return val;
    }
  },
  fromSI: (val, unit) => {
    switch (unit) {
      case 'kPa': return val / 1000;
      case 'atm': return val / 101325;
      case 'Pa':
      default: return val;
    }
  }
};

export const convertVolume = {
  toSI: (val, unit) => {
    switch (unit) {
      case 'L': return val / 1000;
      case 'm3':
      default: return val;
    }
  },
  fromSI: (val, unit) => {
    switch (unit) {
      case 'L': return val * 1000;
      case 'm3':
      default: return val;
    }
  }
};

export const convertTemp = {
  toSI: (val, unit) => {
    switch (unit) {
      case 'C': return val + 273.15;
      case 'K':
      default: return val;
    }
  },
  fromSI: (val, unit) => {
    switch (unit) {
      case 'C': return val - 273.15;
      case 'K':
      default: return val;
    }
  }
};

// PHYSICS CALCULATOR ENGINE
export function calculateSimulation(process, inputs) {
  // Extract inputs in SI
  const n = parseFloat(inputs.n);
  const gasType = inputs.gasType || 'diatomico';
  const gamma = gasType === 'monoatomico' ? 5/3 : 7/5;
  
  // Specific capacity calculations based on gamma
  // Cp - Cv = R  and Cp / Cv = gamma
  // Cv = R / (gamma - 1)
  // Cp = gamma * Cv
  const Cv = R / (gamma - 1);
  const Cp = gamma * Cv;

  let Pi = 0, Pf = 0, Vi = 0, Vf = 0, Ti = 0, Tf = 0;
  let W = 0, Q = 0, deltaU = 0, deltaH = 0, W_vol = 0, W_pres = 0, deltaS = 0;
  let mathSteps = [];
  let explanation = "";

  switch (process) {
    case 'isotermico': {
      Ti = convertTemp.toSI(parseFloat(inputs.Ti), inputs.unitT);
      Vi = convertVolume.toSI(parseFloat(inputs.Vi), inputs.unitV);
      Vf = convertVolume.toSI(parseFloat(inputs.Vf), inputs.unitV);
      Tf = Ti;

      // Ideal gas law for pressures
      Pi = (n * R * Ti) / Vi;
      Pf = (n * R * Tf) / Vf;

      // Work done: w = n R T ln(Vf/Vi)
      W = n * R * Ti * Math.log(Vf / Vi);
      deltaU = 0; // T is constant, so U is constant
      Q = W; // q = deltaU + w => q = w
      deltaS = n * R * Math.log(Vf / Vi);

      W_vol = W;
      W_pres = W;
      deltaH = 0;

      // Explanations & steps
      mathSteps = [
        {
          title: "1. Aplicación de la Ley de los Gases Ideales",
          desc: "Calculamos las presiones inicial y final del sistema utilizando P = nRT/V.",
          formula: `P_i = \\frac{n R T_i}{V_i} = \\frac{${n} \\cdot 8.314 \\cdot ${Ti.toFixed(2)}}{${Vi.toFixed(4)}} = ${Pi.toFixed(2)} \\text{ Pa}`
        },
        {
          title: "2. Presión Final",
          desc: "Al ser un proceso isotérmico, la temperatura no varía. Calculamos la presión final del estado B.",
          formula: `P_f = \\frac{n R T_f}{V_f} = \\frac{${n} \\cdot 8.314 \\cdot ${Tf.toFixed(2)}}{${Vf.toFixed(4)}} = ${Pf.toFixed(2)} \\text{ Pa}`
        },
        {
          title: "3. Trabajo de Volumen (w_vol)",
          desc: "El trabajo de expansión o frontera se calcula integrando la presión a lo largo del volumen.",
          formula: `w_{vol} = n R T \\ln\\left(\\frac{V_f}{V_i}\\right) = ${n} \\cdot 8.314 \\cdot ${Ti.toFixed(2)} \\cdot \\ln\\left(\\frac{${Vf.toFixed(4)}}{${Vi.toFixed(4)}}\\right) = ${W_vol.toFixed(2)} \\text{ J}`
        },
        {
          title: "4. Trabajo de Presión (w_pres)",
          desc: "El trabajo de presión (flujo/técnico) se calcula integrando -V dP. Para un gas ideal isotérmico, equivale al de volumen.",
          formula: `w_{pres} = -\\int V dP = -n R T \\ln\\left(\\frac{P_f}{P_i}\\right) = ${W_pres.toFixed(2)} \\text{ J}`
        },
        {
          title: "5. Cambio de Energía Interna (ΔU)",
          desc: "Puesto que la energía interna de un gas ideal depende únicamente de su temperatura y ésta permanece constante:",
          formula: `\\Delta U = n C_v \\Delta T = n C_v (0) = 0 \\text{ J}`
        },
        {
          title: "6. Calor Transferido (q)",
          desc: "De acuerdo con la Primera Ley de la Termodinámica (ΔU = q - w_vol), deducimos el calor:",
          formula: `q = \\Delta U + w_{vol} = 0 + ${W_vol.toFixed(2)} = ${Q.toFixed(2)} \\text{ J}`
        },
        {
          title: "7. Variación de Entalpía (ΔH)",
          desc: "Al igual que la energía interna, en un gas ideal la entalpía depende únicamente de la temperatura, siendo nula a T constante.",
          formula: `\\Delta H = n C_p \\Delta T = n C_p (0) = 0 \\text{ J}`
        },
        {
          title: "8. Variación de Entropía (ΔS)",
          desc: "La entropía cambia debido al cambio de volumen a temperatura constante y se calcula como ΔS = n R ln(Vf/Vi).",
          formula: `\\Delta S = n R \\ln\\left(\\frac{V_f}{V_i}\\right) = ${n} \\cdot 8.314 \\cdot \\ln\\left(\\frac{${Vf.toFixed(4)}}{${Vi.toFixed(4)}}\\right) = ${deltaS.toFixed(4)} \\text{ J/K}`
        }
      ];

      explanation = `En este proceso isotérmico (temperatura constante a ${convertTemp.fromSI(Ti, inputs.unitT).toFixed(1)}°${inputs.unitT}), ` +
        `el volumen se expande/comprime de ${convertVolume.fromSI(Vi, inputs.unitV).toFixed(3)} ${inputs.unitV} a ${convertVolume.fromSI(Vf, inputs.unitV).toFixed(3)} ${inputs.unitV}. ` +
        `Todo el calor transferido al sistema (q = ${Q.toFixed(1)} J) se convierte en trabajo mecánico (w = ${W_vol.toFixed(1)} J). ` +
        `El trabajo de volumen (frontera) y el de presión son iguales (w = ${W_vol.toFixed(1)} J), no hay variación de energía interna ni de entalpía (ΔU = ΔH = 0), y el cambio de entropía es de ${deltaS.toFixed(4)} J/K.`;
      break;
    }

    case 'isobarico': {
      Pi = convertPressure.toSI(parseFloat(inputs.Pi), inputs.unitP);
      Vi = convertVolume.toSI(parseFloat(inputs.Vi), inputs.unitV);
      Vf = convertVolume.toSI(parseFloat(inputs.Vf), inputs.unitV);
      Pf = Pi;

      // Ideal gas law for temperatures
      Ti = (Pi * Vi) / (n * R);
      Tf = (Pf * Vf) / (n * R);

      // Work done: w = P * deltaV
      W = Pi * (Vf - Vi);
      // deltaU = n * Cv * deltaT
      deltaU = n * Cv * (Tf - Ti);
      // q = deltaU + w
      Q = deltaU + W;
      deltaS = n * Cp * Math.log(Tf / Ti);

      W_vol = W;
      W_pres = 0;
      deltaH = n * Cp * (Tf - Ti);

      mathSteps = [
        {
          title: "1. Cálculo de Temperaturas Inicial y Final",
          desc: "Determinamos las temperaturas en base a la ecuación del gas ideal T = PV / (nR).",
          formula: `T_i = \\frac{P_i V_i}{n R} = \\frac{${Pi.toFixed(0)} \\cdot ${Vi.toFixed(4)}}{${n} \\cdot 8.314} = ${Ti.toFixed(2)} \\text{ K}`
        },
        {
          title: "2. Temperatura Final (Tf)",
          desc: "De igual manera, calculamos la temperatura del estado final B.",
          formula: `T_f = \\frac{P_f V_f}{n R} = \\frac{${Pf.toFixed(0)} \\cdot ${Vf.toFixed(4)}}{${n} \\cdot 8.314} = ${Tf.toFixed(2)} \\text{ K}`
        },
        {
          title: "3. Trabajo de Volumen (w_vol)",
          desc: "Al ser la presión constante, el trabajo de volumen es el producto de la presión por el cambio volumétrico.",
          formula: `w_{vol} = P \\cdot (V_f - V_i) = ${Pi.toFixed(0)} \\cdot (${Vf.toFixed(4)} - ${Vi.toFixed(4)}) = ${W_vol.toFixed(2)} \\text{ J}`
        },
        {
          title: "4. Trabajo de Presión (w_pres)",
          desc: "Dado que dP = 0 (proceso a presión constante), no hay trabajo de presión o técnico.",
          formula: `w_{pres} = -\\int V dP = 0 \\text{ J}`
        },
        {
          title: "5. Variación de Energía Interna (ΔU)",
          desc: "Calculamos el cambio de energía interna utilizando Cv = R / (γ - 1).",
          formula: `\\Delta U = n C_v \\Delta T = ${n} \\cdot ${Cv.toFixed(2)} \\cdot (${Tf.toFixed(2)} - ${Ti.toFixed(2)}) = ${deltaU.toFixed(2)} \\text{ J}`
        },
        {
          title: "6. Calor Transferido (q)",
          desc: "El calor transferido a presión constante se deduce de la primera ley:",
          formula: `q = \\Delta U + w_{vol} = ${deltaU.toFixed(2)} + ${W_vol.toFixed(2)} = ${Q.toFixed(2)} \\text{ J}`
        },
        {
          title: "7. Variación de Entalpía (ΔH)",
          desc: "Para un proceso isobárico, la entalpía es exactamente igual al calor transferido (ΔH = q) y se calcula usando Cp.",
          formula: `\\Delta H = n C_p \\Delta T = ${n} \\cdot ${Cp.toFixed(2)} \\cdot (${Tf.toFixed(2)} - ${Ti.toFixed(2)}) = ${deltaH.toFixed(2)} \\text{ J}`
        },
        {
          title: "8. Variación de Entropía (ΔS)",
          desc: "En un proceso isobárico, la variación de entropía se debe al cambio de temperatura a presión constante, utilizando Cp.",
          formula: `\\Delta S = n C_p \\ln\\left(\\frac{T_f}{T_i}\\right) = ${n} \\cdot ${Cp.toFixed(2)} \\cdot \\ln\\left(\\frac{${Tf.toFixed(2)}}{${Ti.toFixed(2)}}\\right) = ${deltaS.toFixed(4)} \\text{ J/K}`
        }
      ];

      explanation = `En un proceso isobárico (presión constante a ${convertPressure.fromSI(Pi, inputs.unitP).toFixed(1)} ${inputs.unitP}), ` +
        `el gas se expande/comprime realizando un trabajo de volumen de ${W_vol.toFixed(1)} J (el de presión es nulo). ` +
        `La temperatura varía de ${convertTemp.fromSI(Ti, inputs.unitT).toFixed(1)}°${inputs.unitT} a ${convertTemp.fromSI(Tf, inputs.unitT).toFixed(1)}°${inputs.unitT}. ` +
        `El calor absorbido/liberado es de (q = ${Q.toFixed(1)} J), el cual equivale al cambio total de entalpía (ΔH = ${deltaH.toFixed(1)} J), ` +
        `empleándose una parte en aumentar la energía interna (ΔU = ${deltaU.toFixed(1)} J) y la otra en realizar trabajo. La entropía varía en ${deltaS.toFixed(4)} J/K.`;
      break;
    }

    case 'isocorico': {
      Vi = convertVolume.toSI(parseFloat(inputs.Vi), inputs.unitV);
      Pi = convertPressure.toSI(parseFloat(inputs.Pi), inputs.unitP);
      Pf = convertPressure.toSI(parseFloat(inputs.Pf), inputs.unitP);
      Vf = Vi;

      // Ideal gas law for temperatures
      Ti = (Pi * Vi) / (n * R);
      Tf = (Pf * Vf) / (n * R);

      // No volume change means w = 0
      W = 0;
      deltaU = n * Cv * (Tf - Ti);
      Q = deltaU; // q = deltaU + w => q = deltaU
      deltaS = n * Cv * Math.log(Tf / Ti);

      W_vol = 0;
      W_pres = -Vi * (Pf - Pi);
      deltaH = n * Cp * (Tf - Ti);

      mathSteps = [
        {
          title: "1. Cálculo de Temperaturas de Estado",
          desc: "Calculamos la temperatura inicial en base a la ley de gases ideales:",
          formula: `T_i = \\frac{P_i V}{n R} = \\frac{${Pi.toFixed(0)} \\cdot ${Vi.toFixed(4)}}{${n} \\cdot 8.314} = ${Ti.toFixed(2)} \\text{ K}`
        },
        {
          title: "2. Temperatura Final",
          desc: "Determinamos la temperatura final alcanzada:",
          formula: `T_f = \\frac{P_f V}{n R} = \\frac{${Pf.toFixed(0)} \\cdot ${Vf.toFixed(4)}}{${n} \\cdot 8.314} = ${Tf.toFixed(2)} \\text{ K}`
        },
        {
          title: "3. Trabajo de Volumen (w_vol)",
          desc: "Como el volumen es constante (isocórico), no hay desplazamiento de frontera, por lo que el trabajo de volumen es nulo.",
          formula: `w_{vol} = P \\cdot \\Delta V = 0 \\text{ J}`
        },
        {
          title: "4. Trabajo de Presión (w_pres)",
          desc: "El trabajo técnico o de presión se efectúa por el cambio de presión a volumen constante y es -V ΔP.",
          formula: `w_{pres} = -V \\cdot (P_f - P_i) = -${Vi.toFixed(4)} \\cdot (${Pf.toFixed(0)} - ${Pi.toFixed(0)}) = ${W_pres.toFixed(2)} \\text{ J}`
        },
        {
          title: "5. Variación de Energía Interna (ΔU) y Calor (q)",
          desc: "Todo el calor transferido va directamente a cambiar la energía interna del gas ya que w_vol = 0.",
          formula: `\\Delta U = q = n C_v (T_f - T_i) = ${n} \\cdot ${Cv.toFixed(2)} \\cdot (${Tf.toFixed(2)} - ${Ti.toFixed(2)}) = ${deltaU.toFixed(2)} \\text{ J}`
        },
        {
          title: "6. Variación de Entalpía (ΔH)",
          desc: "La entalpía se calcula mediante la capacidad calorífica Cp:",
          formula: `\\Delta H = n C_p \\Delta T = ${n} \\cdot ${Cp.toFixed(2)} \\cdot (${Tf.toFixed(2)} - ${Ti.toFixed(2)}) = ${deltaH.toFixed(2)} \\text{ J}`
        },
        {
          title: "7. Variación de Entropía (ΔS)",
          desc: "En un proceso isocórico, la entropía varía con la temperatura a volumen constante, calculada a través de Cv.",
          formula: `\\Delta S = n C_v \\ln\\left(\\frac{T_f}{T_i}\\right) = ${n} \\cdot ${Cv.toFixed(2)} \\cdot \\ln\\left(\\frac{${Tf.toFixed(2)}}{${Ti.toFixed(2)}}\\right) = ${deltaS.toFixed(4)} \\text{ J/K}`
        }
      ];

      explanation = `En este proceso isocórico (volumen constante a ${convertVolume.fromSI(Vi, inputs.unitV).toFixed(3)} ${inputs.unitV}), ` +
        `el trabajo de volumen es nulo (w_vol = 0 J), mientras que el trabajo de presión desarrollado es de ${W_pres.toFixed(1)} J debido al gradiente de presión. ` +
        `Todo el calor transferido (q = ${Q.toFixed(1)} J) se traduce directamente en un cambio proporcional en la energía interna (ΔU = ${deltaU.toFixed(1)} J) ` +
        `y en la entalpía (ΔH = ${deltaH.toFixed(1)} J), modificando la temperatura de ` +
        `${convertTemp.fromSI(Ti, inputs.unitT).toFixed(1)}°${inputs.unitT} a ${convertTemp.fromSI(Tf, inputs.unitT).toFixed(1)}°${inputs.unitT}. La variación de entropía es de ${deltaS.toFixed(4)} J/K.`;
      break;
    }

    case 'adiabatico': {
      Pi = convertPressure.toSI(parseFloat(inputs.Pi), inputs.unitP);
      Vi = convertVolume.toSI(parseFloat(inputs.Vi), inputs.unitV);
      Vf = convertVolume.toSI(parseFloat(inputs.Vf), inputs.unitV);

      // Adiabatic equation: Pi * Vi^gamma = Pf * Vf^gamma => Pf = Pi * (Vi/Vf)^gamma
      Pf = Pi * Math.pow(Vi / Vf, gamma);

      // Temperatures
      Ti = (Pi * Vi) / (n * R);
      Tf = (Pf * Vf) / (n * R);

      // Adiabatic means no heat transfer
      Q = 0;
      // w = (Pi * Vi - Pf * Vf) / (gamma - 1)
      W = (Pi * Vi - Pf * Vf) / (gamma - 1);
      // deltaU = -w
      deltaU = -W;
      deltaS = 0;

      W_vol = W;
      W_pres = gamma * W;
      deltaH = n * Cp * (Tf - Ti);

      mathSteps = [
        {
          title: "1. Cálculo de Presión Final (Pf)",
          desc: "Utilizamos la relación adiabática P_i * V_i^γ = P_f * V_f^γ para despejar P_f.",
          formula: `P_f = P_i \\left(\\frac{V_i}{V_f}\\right)^\\gamma = ${Pi.toFixed(0)} \\cdot \\left(\\frac{${Vi.toFixed(4)}}{${Vf.toFixed(4)}}\\right)^{${gamma.toFixed(2)}} = ${Pf.toFixed(2)} \\text{ Pa}`
        },
        {
          title: "2. Cálculo de Temperaturas Inicial y Final",
          desc: "Calculamos las temperaturas en Kelvin empleando PV = nRT.",
          formula: `T_i = \\frac{P_i V_i}{n R} = ${Ti.toFixed(2)} \\text{ K}, \\quad T_f = \\frac{P_f V_f}{n R} = ${Tf.toFixed(2)} \\text{ K}`
        },
        {
          title: "3. Calor Transferido (q)",
          desc: "Por definición de proceso adiabático, el sistema está térmicamente aislado del exterior:",
          formula: `q = 0 \\text{ J}`
        },
        {
          title: "4. Trabajo de Volumen (w_vol)",
          desc: "El trabajo de volumen o frontera se realiza a expensas del cambio en la energía interna:",
          formula: `w_{vol} = \\frac{P_i V_i - P_f V_f}{\\gamma - 1} = \\frac{${Pi.toFixed(0)} \\cdot ${Vi.toFixed(4)} - ${Pf.toFixed(0)} \\cdot ${Vf.toFixed(4)}}{${gamma.toFixed(2)} - 1} = ${W_vol.toFixed(2)} \\text{ J}`
        },
        {
          title: "5. Trabajo de Presión (w_pres)",
          desc: "El trabajo de presión o flujo en un proceso adiabático es proporcional al trabajo de volumen multiplicándolo por γ.",
          formula: `w_{pres} = -\\int V dP = \\gamma w_{vol} = ${gamma.toFixed(2)} \\cdot ${W_vol.toFixed(2)} = ${W_pres.toFixed(2)} \\text{ J}`
        },
        {
          title: "6. Variación de Energía Interna (ΔU)",
          desc: "De acuerdo con la Primera Ley, ΔU = q - w_vol, al ser q = 0:",
          formula: `\\Delta U = -w_{vol} = -(${W_vol.toFixed(2)}) = ${deltaU.toFixed(2)} \\text{ J}`
        },
        {
          title: "7. Variación de Entalpía (ΔH)",
          desc: "La entalpía se determina con la capacidad calorífica Cp y es igual a -w_pres en procesos adiabáticos:",
          formula: `\\Delta H = n C_p \\Delta T = ${n} \\cdot ${Cp.toFixed(2)} \\cdot (${Tf.toFixed(2)} - ${Ti.toFixed(2)}) = ${deltaH.toFixed(2)} \\text{ J}`
        },
        {
          title: "8. Variación de Entropía (ΔS)",
          desc: "Dado que es un proceso adiabático reversible (isentrópico), no hay transferencia de calor con el entorno, por lo que la variación de entropía es nula.",
          formula: `\\Delta S = 0 \\text{ J/K}`
        }
      ];

      explanation = `En un proceso adiabático, el sistema no intercambia calor (q = 0 J). ` +
        `Al expandirse el volumen, el gas realiza un trabajo de volumen de ${W_vol.toFixed(1)} J a costa de su propia energía interna (ΔU = ${deltaU.toFixed(1)} J). ` +
        `El trabajo de presión desarrollado es de ${W_pres.toFixed(1)} J, lo que produce una entalpía de ${deltaH.toFixed(1)} J ` +
        `y un enfriamiento de ${convertTemp.fromSI(Ti, inputs.unitT).toFixed(1)}°${inputs.unitT} a ${convertTemp.fromSI(Tf, inputs.unitT).toFixed(1)}°${inputs.unitT}. La variación de entropía es estrictamente nula (ΔS = 0 J/K).`;
      break;
    }
  }

  return {
    Pi, Pf, Vi, Vf, Ti, Tf,
    W, Q, deltaU,
    deltaH, W_vol, W_pres, deltaS,
    mathSteps,
    explanation
  };
}

// PLOT POINTS GENERATOR
export function generateProcessCurve(process, simData, pointsCount = 40) {
  const { Vi, Vf, Pi, Pf, Ti, Tf, gamma } = simData;
  const points = [];
  
  const minV = Math.min(Vi, Vf);
  const maxV = Math.max(Vi, Vf);
  const step = (maxV - minV) / (pointsCount - 1);

  if (process === 'isocorico') {
    // For isochoric, it is a vertical line. Chart.js needs points along pressure
    const minP = Math.min(Pi, Pf);
    const maxP = Math.max(Pi, Pf);
    const pStep = (maxP - minP) / (pointsCount - 1);
    for (let i = 0; i < pointsCount; i++) {
      points.push({
        x: Vi,
        y: minP + i * pStep
      });
    }
  } else if (process === 'isobarico') {
    // Horizontal line
    for (let i = 0; i < pointsCount; i++) {
      points.push({
        x: minV + i * step,
        y: Pi
      });
    }
  } else if (process === 'isotermico') {
    // Hyperbola P = nRT/V
    // Let's use the average nRT to draw the curve
    const nRT = Pi * Vi; // Since Ti = Tf, nRT = Pi * Vi
    
    // We want to generate points ordered from left to right (increasing volume)
    for (let i = 0; i < pointsCount; i++) {
      const v = minV + i * step;
      points.push({
        x: v,
        y: nRT / v
      });
    }
  } else if (process === 'adiabatico') {
    // P = C / V^gamma where C = Pi * Vi^gamma
    const C = Pi * Math.pow(Vi, gamma);
    for (let i = 0; i < pointsCount; i++) {
      const v = minV + i * step;
      points.push({
        x: v,
        y: C / Math.pow(v, gamma)
      });
    }
  }

  return points;
}
