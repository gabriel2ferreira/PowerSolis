# Integração do Sistema de Modelos Duplos de Envelhecimento

## 1. Schema do Banco de Dados
- [x] Novas colunas em `equipment_api_config`: `ponto_quente_externo`, `estrategia_envelhecimento`, `vida_util_isolamento_h`.
- [x] Nova tabela: `equipment_health_history` para rastrear evolução com métricas detalhadas.
- [x] Nova tabela: `equipment_alerts_log` para persistência robusta de estados de atenção e crítico.
- [x] RLS Policies aplicadas.

## 2. Lógica de Envelhecimento
- [x] `src/utils/equipmentAging.js` criado contendo:
  - Cálculo de Saúde baseado em Tempo.
  - Cálculo de Fator de Aceleração de Envelhecimento (FAA).
  - Lógica para `pior_caso` com comparação de modelos.

## 3. Integração de Interface e Estado
- [x] `src/utils/healthCalculation.js` atualizado para repassar configurações ao modelo duplo e preservar a camada de UI existente.
- [x] Serviços construídos: `equipmentHealthSync.js` e `equipmentAlertService.js`.
- [x] Interface Modificada (Dashboard, Search, Details) para disparar logs e consultar novos campos.

## 4. UI/UX 
- [x] `EditEquipmentModal.jsx` refatorado para preservação de scroll, adicionando campos de Estratégia de Envelhecimento, Hotspot e Vida Útil Isolamento.
- [x] `HealthHistoryChart.jsx` componente de visualização implementado com uso do recharts.