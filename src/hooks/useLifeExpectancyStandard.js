import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useLifeExpectancyStandard = () => {
  const { user } = useAuth();
  const [standard, setStandard] = useState('IEEE C57.91-2011');
  const [loading, setLoading] = useState(true);

  const fetchStandard = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('calc_standard')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching standard from profile:', error);
      } else if (data?.calc_standard) {
        setStandard(data.calc_standard);
      }
    } catch (err) {
      console.error('Failed to fetch standard:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStandard();
  }, [fetchStandard]);

  const updateStandard = async (newStandard) => {
    if (!user?.id) return false;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ calc_standard: newStandard })
        .eq('id', user.id);
        
      if (error) throw error;
      setStandard(newStandard);
      return true;
    } catch (err) {
      console.error('Error updating standard:', err);
      return false;
    }
  };

  return { standard, updateStandard, loading };
};