
import { logger } from '@/lib/debugLogger';

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

function minMaxScale(value, min, max) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

function buildPolynomialFeaturesDegree2([x1, x2, x3, x4]) {
  return [
    x1, x2, x3, x4,
    x1 * x1, x1 * x2, x1 * x3, x1 * x4,
    x2 * x2, x2 * x3, x2 * x4,
    x3 * x3, x3 * x4,
    x4 * x4
  ];
}

export const inferirTemperaturaHotspot = async ({
  tangente_perdas,
  corrente_primario,
  temperatura_ambiente,
  ponto_quente_externo
}) => {
  try {
    const raw = [
      parseFloat(tangente_perdas) || 0.2,
      parseFloat(corrente_primario) || 1500,
      parseFloat(temperatura_ambiente) || 25,
      parseFloat(ponto_quente_externo) || 25
    ];

    const scaled = raw.map((v, i) =>
      minMaxScale(v, HOTSPOT_MODEL.dataMin[i], HOTSPOT_MODEL.dataMax[i])
    );

    const poly = buildPolynomialFeaturesDegree2(scaled);

    const prediction =
      HOTSPOT_MODEL.intercept +
      poly.reduce((sum, f, i) => sum + f * HOTSPOT_MODEL.coefficients[i], 0);

    const resultadoOriginal = Number(prediction.toFixed(6));
    const resultado = Math.max(resultadoOriginal, 25);

    logger.info('hotspotInferenceService', 'Temperatura hotspot inferida (JS local)', { 
      original: resultadoOriginal, 
      final: resultado 
    });
    
    return resultado;
  } catch (err) {
    logger.error('hotspotInferenceService', 'Falha ao inferir temperatura do hotspot', err);
    return null;
  }
};
