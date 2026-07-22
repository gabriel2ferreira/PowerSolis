
export const HOTSPOT_MODEL = {
  // Configurações do modelo treinado (valores de referência/exemplo para o pipeline)
  dataMin: [0.0, 0.0, 10.0, 20.0],       // [tangente_perdas, corrente_primario, temperatura_ambiente, ponto_quente_externo]
  dataMax: [0.15, 1000.0, 50.0, 100.0],
  coefficients: [
    1.205, 0.850, 1.100, 2.300,  // Termos lineares
    0.015, 0.020, 0.010, 0.050,  // Interações com tangente_perdas
    0.040, 0.030, 0.060,         // Interações com corrente_primario
    0.025, 0.080,                // Interações com temperatura_ambiente
    0.150                        // Interação ponto_quente_externo^2
  ],
  intercept: 22.5
};

export const toNum = (value, fallback = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

export const minMaxScale = (features, minArr, maxArr) => {
  return features.map((val, i) => {
    const min = minArr[i];
    const max = maxArr[i];
    if (max === min) return 0;
    
    // Garante que o valor não passe dos limites para não distorcer o modelo
    const boundedVal = Math.max(min, Math.min(max, val));
    return (boundedVal - min) / (max - min);
  });
};

export const polyFeatures = (x) => {
  const [x0, x1, x2, x3] = x;
  return [
    x0, x1, x2, x3,             // Grau 1
    x0 * x0, x0 * x1, x0 * x2, x0 * x3, // Grau 2 (x0)
    x1 * x1, x1 * x2, x1 * x3,  // Grau 2 (x1)
    x2 * x2, x2 * x3,           // Grau 2 (x2)
    x3 * x3                     // Grau 2 (x3)
  ];
};

export const inferirTemperaturaHotspot = (data) => {
  try {
    const { 
      tangente_perdas, 
      corrente_primario, 
      temperatura_ambiente, 
      ponto_quente_externo 
    } = data;
    
    const rawFeatures = [
      toNum(tangente_perdas, 0.02),
      toNum(corrente_primario, 100.0),
      toNum(temperatura_ambiente, 25.0),
      toNum(ponto_quente_externo, 30.0)
    ];

    // 1. Min-Max Scaling (normalização)
    const scaledFeatures = minMaxScale(rawFeatures, HOTSPOT_MODEL.dataMin, HOTSPOT_MODEL.dataMax);

    // 2. Polynomial Features (geração de features polinomiais grau 2)
    const poly = polyFeatures(scaledFeatures);

    // 3. Dot product (coeficientes * features) + intercept
    let prediction = HOTSPOT_MODEL.intercept;
    for (let i = 0; i < poly.length; i++) {
      prediction += poly[i] * (HOTSPOT_MODEL.coefficients[i] || 0);
    }

    console.log("=== ML Model Debug ===");
    console.log("Raw Features:", rawFeatures);
    console.log("Scaled Features:", scaledFeatures);
    console.log("Poly Features:", poly);
    console.log("Raw Prediction:", prediction);

    return prediction;
  } catch (error) {
    console.error("Error in ML inference:", error);
    return null;
  }
};
