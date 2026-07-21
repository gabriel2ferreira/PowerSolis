import { supabase } from '@/lib/customSupabaseClient';

export const saveTimeSeriesData = async (equipmentId, dataType, value, timestamp) => {
  try {
    const payload = {
      equipment_id: equipmentId,
      report_date: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
    };

    if (dataType === 'temperatura_ambiente') {
      payload.temperature = parseFloat(value);
    } else {
      payload.other_metrics = { [dataType]: value };
    }

    const { data, error } = await supabase.from('equipment_data_history').insert(payload).select();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving time series data:', error);
    return { success: false, error };
  }
};

export const getTimeSeriesData = async (equipmentId, dataType, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('equipment_data_history')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('report_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching time series data:', error);
    return [];
  }
};

export const calculateTimeSeriesTrend = (data) => {
  if (!data || data.length < 2) return 0;
  
  // Simple slope calculation (y2 - y1) / (x2 - x1)
  // Assuming data is sorted newest first
  const newest = data[0];
  const oldest = data[data.length - 1];
  
  // Extract generic value to compare
  const getVal = (item) => parseFloat(item.temperature || item.other_metrics?.value || 0);
  
  const yDiff = getVal(newest) - getVal(oldest);
  const xDiff = new Date(newest.report_date).getTime() - new Date(oldest.report_date).getTime();
  
  return xDiff === 0 ? 0 : (yDiff / xDiff) * 1000 * 60 * 60 * 24; // Trend per day
};