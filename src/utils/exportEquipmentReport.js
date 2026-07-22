import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { format } from 'date-fns';

export const exportEquipmentReportPDF = (equipment, healthData, healthHistory, maintenanceHistory) => {
  const doc = new jsPDF();
  const api = equipment.api_config || {};
  const custom = equipment.custom_fields || {};
  
  // Title
  doc.setFontSize(18);
  doc.text(`Relatório de Equipamento: ${equipment.name}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

  // 1. Saúde e Desempenho
  doc.autoTable({
    startY: 30,
    head: [['1. Saúde e Desempenho', 'Valor']],
    body: [
      ['Saúde (Pior Caso / Final)', `${healthData?.percentage?.toFixed(1) || 0}%`],
      ['Status', healthData?.status || 'N/A'],
      ['Vida Remanescente', `${healthData?.vidaRemanescenteAnos?.toFixed(1) || 0} anos`],
      ['Fator de Aceleração', `${healthData?.fatorAceleracao?.toFixed(2) || 1}x`],
      ['Data de Instalação', equipment.installation_date ? format(new Date(equipment.installation_date), 'dd/MM/yyyy') : 'N/A']
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // 2. Parâmetros de Cálculo
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [['2. Parâmetros de Cálculo', 'Valor']],
    body: [
      ['Vida de Referência', `${api.vida_ref_anos || 25} anos`],
      ['Tangente de Perdas', api.tangente_perdas || '0'],
      ['Corrente Primária', `${api.corrente_primario || 0} A`],
      ['Temp. Ambiente', `${api.temperatura_ambiente || 25} °C`],
      ['Temp. Hotspot', `${api.ponto_quente_externo || 25} °C`],
      ['Horas de Operação', `${api.horas_operacao || 0} h`],
      ['Estratégia Envelhecimento', api.estrategia_envelhecimento || 'pior_caso']
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // 3. Informações Básicas
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [['3. Informações Básicas', 'Valor']],
    body: [
      ['Nome', equipment.name || 'N/A'],
      ['Tipo', equipment.equipment_types?.name || 'N/A'],
      ['Fabricante', custom.manufacturer || 'N/A'],
      ['Modelo', custom.model || 'N/A'],
      ['Número de Série', custom.serial_number || 'N/A'],
      ['Fase', equipment.phase || 'N/A']
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // 4. Health History
  const historyBody = (healthHistory || []).map(h => [
    format(new Date(h.timestamp || h.created_at), 'dd/MM/yyyy HH:mm'),
    `${h.saude_percent_final || 0}%`,
    `${h.vida_remanescente_anos_final || 0} anos`,
    `${h.fator_aceleracao || 1}x`
  ]);
  
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [['4. Histórico de Saúde (Evolução no Tempo)', 'Saúde Final', 'Vida Remanescente', 'Fator de Aceleração']],
    body: historyBody.length > 0 ? historyBody : [['Sem registros de histórico', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // 5. Histórico de Manutenção
  const maintBody = (maintenanceHistory || []).map(m => [
    format(new Date(m.changed_at), 'dd/MM/yyyy HH:mm'),
    m.field_name,
    m.change_type === 'maintenance_note' ? m.new_value : `${m.old_value || '-'} -> ${m.new_value || '-'}`
  ]);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [['5. Histórico de Manutenção', 'Ação / Campo', 'Detalhes']],
    body: maintBody.length > 0 ? maintBody : [['Sem histórico de manutenção', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // 6. Informações de Localização
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [['6. Informações de Localização', 'Valor']],
    body: [
      ['Cidade', equipment.city || 'N/A'],
      ['Estado', equipment.state || 'N/A'],
      ['Subestação', equipment.substation_id || 'N/A'],
      ['Latitude', equipment.latitude || 'N/A'],
      ['Longitude', equipment.longitude || 'N/A']
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  doc.save(`relatorio_${equipment.name || 'equipamento'}.pdf`);
};

export const exportEquipmentReportCSV = (equipment, healthData, healthHistory, maintenanceHistory) => {
  const api = equipment.api_config || {};
  const custom = equipment.custom_fields || {};

  const rows = [];

  // Section 1
  rows.push(['--- 1. SAÚDE E DESEMPENHO ---']);
  rows.push(['Métrica', 'Valor']);
  rows.push(['Saúde (Pior Caso / Final)', `${healthData?.percentage?.toFixed(1) || 0}%`]);
  rows.push(['Status', healthData?.status || 'N/A']);
  rows.push(['Vida Remanescente', `${healthData?.vidaRemanescenteAnos?.toFixed(1) || 0} anos`]);
  rows.push(['Fator de Aceleração', `${healthData?.fatorAceleracao?.toFixed(2) || 1}x`]);
  rows.push(['Data de Instalação', equipment.installation_date ? format(new Date(equipment.installation_date), 'dd/MM/yyyy') : 'N/A']);
  rows.push([]);

  // Section 2
  rows.push(['--- 2. PARÂMETROS DE CÁLCULO ---']);
  rows.push(['Parâmetro', 'Valor']);
  rows.push(['Vida de Referência', `${api.vida_ref_anos || 25} anos`]);
  rows.push(['Tangente de Perdas', api.tangente_perdas || '0']);
  rows.push(['Corrente Primária', `${api.corrente_primario || 0} A`]);
  rows.push(['Temp. Ambiente', `${api.temperatura_ambiente || 25} °C`]);
  rows.push(['Temp. Hotspot', `${api.ponto_quente_externo || 25} °C`]);
  rows.push(['Horas de Operação', `${api.horas_operacao || 0} h`]);
  rows.push(['Estratégia Envelhecimento', api.estrategia_envelhecimento || 'pior_caso']);
  rows.push([]);

  // Section 3
  rows.push(['--- 3. INFORMAÇÕES BÁSICAS ---']);
  rows.push(['Campo', 'Valor']);
  rows.push(['Nome', equipment.name || 'N/A']);
  rows.push(['Tipo', equipment.equipment_types?.name || 'N/A']);
  rows.push(['Fabricante', custom.manufacturer || 'N/A']);
  rows.push(['Modelo', custom.model || 'N/A']);
  rows.push(['Número de Série', custom.serial_number || 'N/A']);
  rows.push(['Fase', equipment.phase || 'N/A']);
  rows.push([]);

  // Section 4
  rows.push(['--- 4. HISTÓRICO DE SAÚDE ---']);
  rows.push(['Data', 'Saúde Final', 'Vida Remanescente', 'Fator de Aceleração']);
  if (healthHistory && healthHistory.length > 0) {
    healthHistory.forEach(h => {
      rows.push([
        format(new Date(h.timestamp || h.created_at), 'dd/MM/yyyy HH:mm'),
        `${h.saude_percent_final || 0}%`,
        `${h.vida_remanescente_anos_final || 0} anos`,
        `${h.fator_aceleracao || 1}x`
      ]);
    });
  } else {
    rows.push(['Sem registros de histórico', '', '', '']);
  }
  rows.push([]);

  // Section 5
  rows.push(['--- 5. HISTÓRICO DE MANUTENÇÃO ---']);
  rows.push(['Data', 'Ação / Campo', 'Detalhes']);
  if (maintenanceHistory && maintenanceHistory.length > 0) {
    maintenanceHistory.forEach(m => {
      rows.push([
        format(new Date(m.changed_at), 'dd/MM/yyyy HH:mm'),
        m.field_name,
        m.change_type === 'maintenance_note' ? m.new_value : `${m.old_value || '-'} -> ${m.new_value || '-'}`
      ]);
    });
  } else {
    rows.push(['Sem histórico de manutenção', '', '']);
  }
  rows.push([]);

  // Section 6
  rows.push(['--- 6. INFORMAÇÕES DE LOCALIZAÇÃO ---']);
  rows.push(['Campo', 'Valor']);
  rows.push(['Cidade', equipment.city || 'N/A']);
  rows.push(['Estado', equipment.state || 'N/A']);
  rows.push(['Subestação', equipment.substation_id || 'N/A']);
  rows.push(['Latitude', equipment.latitude || 'N/A']);
  rows.push(['Longitude', equipment.longitude || 'N/A']);

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `relatorio_${equipment.name || 'equipamento'}.csv`;
  link.click();
};