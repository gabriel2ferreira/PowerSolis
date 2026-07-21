import { useCallback } from 'react';

export const useAgingModel = () => {
  const calcularPerdaVidaUtil = useCallback((temperatura_hotspot, horas_operacao) => {
    const hotspot = Math.max(20, Math.min(200, temperatura_hotspot));
    const hours = Math.max(0, horas_operacao);

    const FAA = Math.pow(2, (hotspot - 85) / 8);
    const expectativa_vida_atual_anos = 25 / FAA;
    const horas_equivalentes_a_95C = hours * FAA;
    const percentual_vida_perdida = (horas_equivalentes_a_95C / (25 * 8760)) * 100;
    const vida_util_restante_anos = Math.max(0, 25 - (percentual_vida_perdida / 100 * 25));

    return {
      FAA,
      expectativa_vida_atual_anos,
      horas_equivalentes_a_95C,
      percentual_vida_perdida: Math.min(100, Math.max(0, percentual_vida_perdida)),
      vida_util_restante_anos
    };
  }, []);

  const inferirTemperaturaHotspot = useCallback((tangente_perdas, corrente_primario, temperatura_ambiente, ponto_externo) => {
    const tangente = tangente_perdas || 0.5;
    const corrente = corrente_primario || 0;
    const temp_amb = temperatura_ambiente || 25;
    const ponto_ext = ponto_externo || 40;

    const predicted = temp_amb 
      + (corrente * 0.005) 
      + (tangente * 15) 
      + (ponto_ext * 0.8) 
      - (Math.pow(corrente, 2) * 0.000001);
      
    return Math.max(20, Math.min(200, predicted));
  }, []);

  const generateForecastPoints = useCallback((vida_util_restante_anos) => {
    const points = [];
    const maxYears = Math.max(1, Math.ceil(vida_util_restante_anos));
    
    for (let ano = 0; ano <= maxYears; ano++) {
      let saude = 0;
      if (vida_util_restante_anos > 0) {
        saude = ((vida_util_restante_anos - ano) / vida_util_restante_anos) * 100;
      }
      points.push({ 
        ano, 
        saude_percentual: Math.max(0, saude) 
      });
    }
    
    return points;
  }, []);

  const calculateFailureProbability = useCallback((vida_util_restante_anos) => {
    if (vida_util_restante_anos > 5) return 5;
    if (vida_util_restante_anos >= 3 && vida_util_restante_anos <= 5) return 15;
    if (vida_util_restante_anos >= 1 && vida_util_restante_anos < 3) return 35;
    return 70; 
  }, []);

  const calcularZonasAtencao = useCallback((vida_util_restante_anos) => {
    // Health from 100% to 30% (Years 0 to 70% of remaining life)
    const limiteVerde = vida_util_restante_anos * 0.7;
    // Health from 30% to 10% (Years 70% to 90% of remaining life)
    const limiteAmarelo = vida_util_restante_anos * 0.9;
    
    return {
      zona_verde: {
        inicio: 0,
        fim: limiteVerde,
        cor: '#10b981',
        label: 'Operação Normal'
      },
      zona_amarela: {
        inicio: limiteVerde,
        fim: limiteAmarelo,
        cor: '#f59e0b',
        label: 'Atenção'
      },
      zona_vermelha: {
        inicio: limiteAmarelo,
        fim: Math.max(Math.ceil(vida_util_restante_anos), vida_util_restante_anos),
        cor: '#ef4444',
        label: 'Falha'
      }
    };
  }, []);

  return {
    calcularPerdaVidaUtil,
    inferirTemperaturaHotspot,
    generateForecastPoints,
    calculateFailureProbability,
    calcularZonasAtencao
  };
};