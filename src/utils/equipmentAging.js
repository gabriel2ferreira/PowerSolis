export const VIDA_UTIL_ISOLAMENTO_H = 25 * 365.25 * 24; // 219,150 hours
export const TEMP_REF_C = 110;
export const TEMP_AMBIENTE_REF_C = 40;

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

export const calcularFAA = (thetaHotspotC) => {
  const faa = Math.pow(2, (thetaHotspotC - TEMP_REF_C) / 6);
  return Math.max(faa, 0.1);
};

export const perdaDeVidaPercentual = (faa, horasOperacao, vidaUtilIsolamentoHoras) => {
  const perda = (faa * horasOperacao / vidaUtilIsolamentoHoras) * 100;
  return Math.min(Math.max(perda, 0), 100);
};

export const calcularVidaPorFAA = ({ thetaHotspotC, horasOperacao, vidaUtilIsolamentoHoras }) => {
  const faa = calcularFAA(thetaHotspotC);
  const perdaPercent = perdaDeVidaPercentual(faa, horasOperacao, vidaUtilIsolamentoHoras);
  const vidaRemPercent = 100 - perdaPercent;
  
  const horasEquivalentesConsumidas = horasOperacao * faa;
  const horasRestantesBase = vidaUtilIsolamentoHoras - horasEquivalentesConsumidas;
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
  vidaUtilH = VIDA_UTIL_ISOLAMENTO_H
}) => {
  const tempoModel = calcularVidaPorTempo({ horasOperacao, vidaUtilIsolamentoHoras: vidaUtilH });
  const faaModel = calcularVidaPorFAA({ thetaHotspotC, horasOperacao, vidaUtilIsolamentoHoras: vidaUtilH });

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