import { supabase } from '@/lib/customSupabaseClient';

export const useReportStorage = () => {
  const uploadPDF = async (fileBlob, fileName) => {
    console.log('[REPORT_STORAGE] Starting PDF upload:', fileName, 'Size:', fileBlob.size);
    try {
      const { data, error } = await supabase.storage
        .from('reports')
        .upload(fileName, fileBlob, { 
          contentType: 'application/pdf',
          upsert: true
        });
        
      if (error) {
        console.error('[REPORT_STORAGE] Upload error:', error);
        throw error;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('reports')
        .getPublicUrl(data.path);

      console.log('[REPORT_STORAGE] Upload successful:', data.path);
      return {
        path: data.path,
        url: publicUrlData.publicUrl
      };
    } catch (error) {
      console.error('[REPORT_STORAGE] Failed to upload PDF:', error);
      throw error;
    }
  };

  const saveReportMetadata = async (metadata) => {
    console.log('[REPORT_DB] Starting database insert for metadata:', metadata);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated for saving report metadata');
      }

      const reportToSave = {
        equipment_id: metadata.equipment_id,
        report_name: metadata.report_name,
        report_date: metadata.report_date,
        file_path: metadata.file_path,
        file_size: metadata.file_size,
        file_url: metadata.file_url,
        status: metadata.status || 'completed',
        report_data: metadata.report_data,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[REPORT_DB] Inserting payload:', reportToSave);

      const { data, error } = await supabase
        .from('reports')
        .insert([reportToSave])
        .select()
        .single();
        
      if (error) {
        console.error('[REPORT_DB] Insert error:', error);
        throw error;
      }
      
      console.log('[REPORT_DB] Insert successful. Saved report:', data);
      return data;
    } catch (error) {
      console.error('[REPORT_DB] Failed to save metadata:', error);
      throw error;
    }
  };

  const deletePDF = async (filePath) => {
    console.log('[REPORT_STORAGE] Deleting PDF:', filePath);
    try {
      const { error } = await supabase.storage
        .from('reports')
        .remove([filePath]);
        
      if (error) {
        console.error('[REPORT_STORAGE] Delete error:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('[REPORT_STORAGE] Failed to delete PDF:', error);
      throw error;
    }
  };

  const getReportsList = async () => {
    console.log('[REPORT_DB] Fetching reports list');
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, equipments(name)')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('[REPORT_DB] Fetch error:', error);
        throw error;
      }
      
      console.log('[REPORT_DB] Fetched reports:', data?.length);
      return data;
    } catch (error) {
      console.error('[REPORT_DB] Failed to fetch reports:', error);
      throw error;
    }
  };

  const deleteReportMetadata = async (reportId) => {
    console.log('[REPORT_DB] Deleting metadata for ID:', reportId);
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);
        
      if (error) {
        console.error('[REPORT_DB] Delete error:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('[REPORT_DB] Failed to delete metadata:', error);
      throw error;
    }
  };

  const downloadPDF = async (fileUrl, fileName) => {
    console.log('[REPORT_STORAGE] Downloading PDF from URL:', fileUrl);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Network response was not ok.');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('[REPORT_STORAGE] Download initiated successfully');
      return true;
    } catch (error) {
      console.error('[REPORT_STORAGE] Download error:', error);
      throw error;
    }
  };

  return { 
    uploadPDF, 
    saveReportMetadata, 
    deletePDF, 
    getReportsList, 
    deleteReportMetadata,
    downloadPDF 
  };
};