import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const generateLifeExpectancyPDF = async (equipmentData, healthMetrics, thermalData, standard) => {
  if (!equipmentData) throw new Error("Dados do equipamento ausentes");

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  const addHeader = (title) => {
    doc.setFillColor(33, 150, 243); // Primary color
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(title, 14, 14);
    doc.setFontSize(10);
    doc.text(format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR }), pageWidth - 14, 14, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset text color
  };

  const addFooter = (pageNumber) => {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Power Solis - Relatório Gerado Automáticamente | Página ${pageNumber}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  let pageNumber = 1;
  addHeader("Relatório de Gestão de Vida Útil");
  
  doc.setFontSize(14);
  doc.text("Informações do Equipamento", 14, 35);
  
  doc.autoTable({
    startY: 40,
    head: [['Propriedade', 'Valor']],
    body: [
      ['Nome/TAG', equipmentData.name || 'N/A'],
      ['Subestação', equipmentData.substation_id || 'N/A'],
      ['Data de Instalação', equipmentData.installation_date ? format(new Date(equipmentData.installation_date), 'dd/MM/yyyy') : 'N/A'],
      ['Vida Útil Estimada (Design)', `${equipmentData.lifespan_years || 20} anos`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 10 }
  });

  let finalY = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.text("Métricas de Saúde e Degradação", 14, finalY);
  
  const health = healthMetrics.health || 100;
  const lol = healthMetrics.lol || 0;
  
  let statusText = "Normal";
  if (health <= 0) statusText = "Fim de Vida";
  else if (health < 25) statusText = "Crítico";
  else if (health < 50) statusText = "Atenção";

  doc.autoTable({
    startY: finalY + 5,
    head: [['Métrica', 'Valor', 'Status']],
    body: [
      ['Saúde Atual (Vida Restante)', `${health.toFixed(2)}%`, statusText],
      ['Perda de Vida (LOL)', `${lol.toFixed(2)}%`, '-'],
      ['Padrão de Cálculo Utilizado', standard, '-']
    ],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 10 }
  });

  finalY = doc.lastAutoTable.finalY + 15;

  if (thermalData && thermalData.length > 0) {
    const temps = thermalData.map(d => parseFloat(d.hot_spot_temperature));
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const peakTemp = Math.max(...temps);
    
    doc.setFontSize(14);
    doc.text("Monitoramento Térmico (Histórico)", 14, finalY);
    
    doc.autoTable({
      startY: finalY + 5,
      head: [['Indicador', 'Temperatura (°C)']],
      body: [
        ['Temperatura Média', avgTemp.toFixed(2)],
        ['Temperatura de Pico (Máxima)', peakTemp.toFixed(2)],
        ['Última Temperatura Registrada', temps[temps.length - 1].toFixed(2)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 10 }
    });
    
    finalY = doc.lastAutoTable.finalY + 15;
  }

  doc.setFontSize(14);
  doc.text("Recomendações", 14, finalY);
  doc.setFontSize(10);
  
  let recommendation = "O equipamento está operando dentro dos parâmetros normais. Mantenha o plano de manutenção preventiva regular.";
  if (health < 25) {
    recommendation = "CRÍTICO: O equipamento atingiu um nível severo de degradação. Recomenda-se substituição ou reforma imediata para evitar falhas catastróficas.";
  } else if (health < 50) {
    recommendation = "ATENÇÃO: Degradação acelerada detectada. Recomenda-se intensificar o monitoramento térmico e realizar ensaios físico-químicos no óleo isolante.";
  }
  
  const splitRec = doc.splitTextToSize(recommendation, pageWidth - 28);
  doc.text(splitRec, 14, finalY + 8);

  addFooter(pageNumber);

  return doc.output('blob');
};