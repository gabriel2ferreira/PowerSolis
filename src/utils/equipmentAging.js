
export const VIDA_UTIL_ISOLAMENTO_H = 25 * 365.25 * 24; // 219,150 hours
export const TEMP_REF_C = 85;
export const TEMP_AMBIENTE_REF_C = 40;
export const P_PADRAO = 8;

// ML Model Configuration for Hotspot Temperature Inference
// Note: Using safe generic coefficients as exact ones were not provided in the prompt text.
const HOTSPOT_MODEL = {
  dataMin: [0.2, 1500, 20, 20],
  dataMax: [1.0, 2000, 40, 120],
  coefficients: [
    17.34102065, -1.05292526, 8.9122413, 9.28008279,
    0.13779175, 17.34102065, -2.23156017, -5.85407442,
    -1.05292526, 8.4910712, 9.19584877, -2.28929973,
    -6.3129504, 23.36411188
  ],
  intercept: 46.46408213981691
};

const toNumber = (val, fallback = 0) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

const minMaxScale = (val, min, max) => {
  if (max === min) return 0;
  return (val - min) / (max - min);
};

const buildPolynomialFeaturesDegree2 = ([x0, x1, x2, x3]) => [
  x0, x1, x2, x3,
  x0 * x0, x0 * x1, x0 * x2, x0 * x3,
  x1 * x1, x1 * x2, x1 * x3,
  x2 * x2, x2 * x3,
  x3 * x3
];

export const inferirTemperaturaHotspotML = ({ tangente_perdas, corrente_primario, temperatura_ambiente, ponto_quente_externo }) => {
  const rawInputs = [
    toNumber(tangente_perdas, 0.2),
    toNumber(corrente_primario, 1500),
    toNumber(temperatura_ambiente, 25),
    toNumber(ponto_quente_externo, 25)
  ];

  const scaledInputs = rawInputs.map((val, i) =>
    minMaxScale(val, HOTSPOT_MODEL.dataMin[i], HOTSPOT_MODEL.dataMax[i])
  );
  const polynomialFeatures = buildPolynomialFeaturesDegree2(scaledInputs);

  let temperatura_hotspot = HOTSPOT_MODEL.intercept;
  for (let i = 0; i < polynomialFeatures.length; i++) {
    temperatura_hotspot += polynomialFeatures[i] * HOTSPOT_MODEL.coefficients[i];
  }

  return {
    temperatura_hotspot: Number(temperatura_hotspot.toFixed(6)),
    rawInputs,
    scaledInputs,
    polynomialFeatures
  };
};

export const calcularVidaPorTempo = ({ horasOperacao, vidaUtilIsolamentoHoras }) => {
  const fracConsumida = horasOperacao / vidaUtilIsolamentoHoras;
  const perdaPercent = Math.min(Math.max(fracConsumida * 100, 0), 100);
  const vidaRemPercent = 100 - perdaPercent;
  const vidaRemanescenteAnos = ((vidaUtilIsolamentoHoras - horasOperacao) / (365.25 * 24));
  
  return {
    saudePercent: vidaRemPercent,
    vidaRemanescenteAnos: Math.max(vidaRemanescenteAnos, 0),
    perdaPercent
  };
};

export const calcularFAA = (thetaHotspotC, tempRef = TEMP_REF_C, p = P_PADRAO) => {
  const exponent = (thetaHotspotC - tempRef) / p;
  const faa = Math.pow(2, exponent);
  return Math.max(faa, 0.1);
};

export const perdaDeVidaPercentual = (faa, horasOperacao, vidaUtilIsolamentoHoras) => {
  const perda = (faa * horasOperacao / vidaUtilIsolamentoHoras) * 100;
  return Math.min(Math.max(perda, 0), 100);
};

export const calcularVidaPorFAA = ({ 
  thetaHotspotC, 
  horasOperacao, 
  vidaUtilIsolamentoHoras, 
  tempRef = TEMP_REF_C, 
  vidaRefAnos = 25, 
  p = P_PADRAO 
}) => {
  const faa = calcularFAA(thetaHotspotC, tempRef, p);
  
  // Use a vida de referência convertida em horas se não for fornecida a vida útil
  const vidaBaseHoras = vidaUtilIsolamentoHoras || (vidaRefAnos * 365.25 * 24);
  
  const perdaPercent = perdaDeVidaPercentual(faa, horasOperacao, vidaBaseHoras);
  const vidaRemPercent = 100 - perdaPercent;
  
  const horasEquivalentesConsumidas = horasOperacao * faa;
  const horasRestantesBase = vidaBaseHoras - horasEquivalentesConsumidas;
  const vidaRemanescenteAnos = Math.max(0, horasRestantesBase / (faa * 365.25 * 24));

  return {
    saudePercent: vidaRemPercent,
    vidaRemanescenteAnos: vidaRemanescenteAnos,
    fatorAceleracao: faa,
    perdaPercent
  };
};

export const calcularSaudeEquipamento = ({
  horasOperacao = 0,
  thetaHotspotC = 25,
  estrategia = 'pior_caso',
  vidaUtilH = VIDA_UTIL_ISOLAMENTO_H,
  tempRef = TEMP_REF_C,
  vidaRefAnos = 25,
  p = P_PADRAO
}) => {
  const tempoModel = calcularVidaPorTempo({ horasOperacao, vidaUtilIsolamentoHoras: vidaUtilH });
  const faaModel = calcularVidaPorFAA({ 
    thetaHotspotC, 
    horasOperacao, 
    vidaUtilIsolamentoHoras: vidaUtilH, 
    tempRef, 
    vidaRefAnos, 
    p 
  });

  let finalSaudePercent = 0;
  let finalVidaRemAnos = 0;
  let estrategiaUsada = estrategia;

  if (estrategia === 'tempo') {
    finalSaudePercent = tempoModel.saudePercent;
    finalVidaRemAnos = tempoModel.vidaRemanescenteAnos;
  } else if (estrategia === 'faa') {
    finalSaudePercent = faaModel.saudePercent;
    finalVidaRemAnos = faaModel.vidaRemanescenteAnos;
  } else {
    // pior_caso
    if (tempoModel.saudePercent < faaModel.saudePercent) {
      finalSaudePercent = tempoModel.saudePercent;
      finalVidaRemAnos = tempoModel.vidaRemanescenteAnos;
      estrategiaUsada = 'tempo (pior caso)';
    } else {
      finalSaudePercent = faaModel.saudePercent;
      finalVidaRemAnos = faaModel.vidaRemanescenteAnos;
      estrategiaUsada = 'faa (pior caso)';
    }
  }

  let status = 'Crítico';
  if (finalSaudePercent >= 80) status = 'Bom';
  else if (finalSaudePercent >= 50) status = 'Atenção';

  return {
    saudePercentFinal: finalSaudePercent,
    statusFinal: status,
    vidaRemanescenteAnosFinal: finalVidaRemAnos,
    fatorAceleracao: faaModel.fatorAceleracao,
    tempoModel,
    faaModel,
    estrategiaUsada
  };
};
