import { supabase } from '@/lib/customSupabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const logHistory = async (equipmentId, changeType, fieldName, oldValue, newValue, userId) => {
  try {
    const { error } = await supabase.from('equipment_history').insert({
      equipment_id: equipmentId,
      changed_by: userId,
      change_type: changeType,
      field_name: fieldName,
      old_value: oldValue ? String(oldValue) : null,
      new_value: newValue ? String(newValue) : null,
    });
    if (error) throw error;
  } catch (error) {
    console.error('Error logging history:', error);
  }
};

export const generateEquipmentPDF = (equipment, reportData, historyData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185);
  doc.text("Power Solis - Equipment Report", pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, pageWidth / 2, 28, { align: 'center' });

  // Equipment Basic Info
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Equipment Details", 14, 40);
  
  const basicInfo = [
    ['Name (TAG)', equipment.name],
    ['Type', equipment.equipment_types?.name || 'N/A'],
    ['Voltage Level', `${equipment.voltage_level || '-'} kV`],
    ['Temperature', `${equipment.temperature || '-'} °C`],
    ['Substation', equipment.substation_id || '-']
  ];

  doc.autoTable({
    startY: 45,
    head: [['Property', 'Value']],
    body: basicInfo,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Report Data
  if (reportData && reportData.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Measured Values", 14, finalY);

    const dataRows = reportData.map(item => [
      item.custom_fields?.field_name,
      item.value,
      item.custom_fields?.field_type,
      format(new Date(item.recorded_at), 'PPP')
    ]);

    doc.autoTable({
      startY: finalY + 5,
      head: [['Field', 'Value', 'Type', 'Recorded At']],
      body: dataRows,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113] },
    });
  }

  // History (Optional, typically last 5 entries)
  if (historyData && historyData.length > 0) {
    const finalY = doc.lastAutoTable.finalY + 15;
    
    // Check if we need a new page
    if (finalY > 250) {
      doc.addPage();
      doc.text("Recent History", 14, 20);
    } else {
      doc.text("Recent History", 14, finalY);
    }

    const historyRows = historyData.slice(0, 10).map(h => [
      format(new Date(h.changed_at), 'PP p'),
      h.change_type,
      h.field_name,
      h.new_value
    ]);

    doc.autoTable({
      startY: finalY > 250 ? 25 : finalY + 5,
      head: [['Date', 'Action', 'Field', 'New Value']],
      body: historyRows,
      theme: 'striped',
      headStyles: { fillColor: [149, 165, 166] },
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
  }

  doc.save(`Report_${equipment.name}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};