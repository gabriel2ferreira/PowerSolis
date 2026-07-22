import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const AuthContext = createContext(undefined);

/**
 * Helper function for retrying failed requests with exponential backoff and timeout.
 */
const executeWithRetry = async (operationName, operation, maxRetries = 2, initialDelay = 500, timeoutMs = 10000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[${operationName}] Starting fetch (Attempt ${attempt + 1}/${maxRetries})...`);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout: Request took longer than ${timeoutMs}ms`)), timeoutMs)
      );

      const result = await Promise.race([operation(), timeoutPromise]);
      
      if (result && result.error && result.error.code !== 'PGRST116') {
        throw result.error;
      }
      
      return result;
    } catch (error) {
      console.error(`[${operationName}] Error on attempt ${attempt + 1}:`, error.message || error);
      
      // Stop retrying on auth/permission errors
      if (error.status === 401 || error.status === 403 || error.code === 'PGRST301') {
        console.error(`[${operationName}] Authentication/Permission error detected. Stopping retries.`);
        throw error;
      }
      
      if (attempt === maxRetries - 1) {
        console.error(`[${operationName}] Max retries reached. Final failure.`);
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`[${operationName}] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) return null;

    const { name, access_level, registration } = authUser.user_metadata || {};
    const cacheKey = `power_solis_profile_${authUser.id}`;
    
    // Cache-first strategy
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Set user immediately from cache to unblock UI
        setUser(parsed);
      }
    } catch (e) {
      console.warn('Could not read cached profile from localStorage', e);
    }
    
    try {
      // Optimized selective query with 10s timeout and 2 retries
      const result = await executeWithRetry(
        'fetchProfile',
        () => supabase
          .from('profiles')
          .select('id, name, access_level, registration, calc_standard')
          .eq('id', authUser.id)
          .single(),
        2,
        500,
        10000
      );
      
      const data = result?.data;
      
      const profile = { 
        ...authUser, 
        name: data?.name || name || authUser.email,
        email: authUser.email, 
        accessLevel: data?.access_level ?? access_level ?? 1,
        registration: data?.registration || registration || 'N/A',
        calc_standard: data?.calc_standard
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify(profile));
      } catch (e) {
        console.warn('Could not cache profile to localStorage', e);
      }

      setUser(profile);
      return profile;
    } catch (error) {
      console.error('Error fetching profile after retries:', error);
      
      const fallbackProfile = {
        id: authUser.id,
        email: authUser.email,
        name: name || authUser.email,
        accessLevel: access_level || 1,
        registration: registration || 'N/A'
      };
      
      setUser(prev => prev || fallbackProfile);
      return fallbackProfile;
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;

      const result = await executeWithRetry(
        'refreshUsers',
        () => supabase.from('profiles').select('id, name, access_level, registration, calc_standard')
      );
      
      if (result?.data) {
        setUsers(result.data.map(p => ({...p, accessLevel: p.access_level})));
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) return;

      const result = await executeWithRetry(
        'refreshLogs',
        () => supabase
          .from('access_logs')
          .select('id, user_id, user_name, action, details, created_at')
          .order('created_at', { ascending: false })
          .limit(50) // Pagination limit
      );
      
      if (result?.data) {
        setLogs(result.data);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  }, []);
  
  const setupAdminUser = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('create-admin-user');
      if (error && !error.message.includes('fetch failed')) {
        console.error('Error setting up admin user:', error.message);
      }
    } catch (e) {
      console.error('Failed to invoke create-admin-user function:', e);
    }
  }, []);

  const handleSession = useCallback(async (newSession) => {
    setSession(newSession);
    if (newSession?.user) {
      const profile = await fetchProfile(newSession.user);
      
      const userAccessLevel = profile?.accessLevel ?? newSession.user.user_metadata?.access_level;
      if (userAccessLevel === 3) {
        refreshUsers().catch(e => console.error(e));
        refreshLogs().catch(e => console.error(e));
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [fetchProfile, refreshUsers, refreshLogs]);

  useEffect(() => {
    if (isInitialized) return;

    const initialize = async () => {
      setLoading(true);
      await setupAdminUser();
      const { data: { session } } = await supabase.auth.getSession();
      await handleSession(session);
      setIsInitialized(true);
    };

    initialize();
  }, [isInitialized, handleSession, setupAdminUser]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          await handleSession(session);
        } else if (event === 'SIGNED_OUT') {
          await handleSession(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const addLog = useCallback(async (action, details = {}) => {
    if (!user) return;
    try {
      await executeWithRetry(
        'addLog',
        () => supabase.from('access_logs').insert({
          user_id: user.id,
          user_name: user.name,
          action,
          details,
        }),
        1,
        500,
        5000
      );
      
      if (user.accessLevel === 3) {
        refreshLogs();
      }
    } catch (error) {
      console.error('Failed to add access log:', error);
    }
  }, [user, refreshLogs]);

  const signUp = useCallback(async (email, password, options) => {
    if (user?.accessLevel !== 3) {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para criar usuários.", variant: "destructive" });
      return { error: { message: "Permission denied" } };
    }
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) throw new Error('Authentication error.');
      
      const { data, error } = await supabase.functions.invoke('create-user', {
        headers: { 'Authorization': `Bearer ${sessionData.session.access_token}` },
        body: { 
          email, password,
          name: options.data.name,
          registration: options.data.registration,
          accessLevel: options.data.access_level
        },
      });

      if (error) throw error;
  
      toast({ title: "Usuário criado!", description: "O novo usuário foi adicionado com sucesso." });
      await refreshUsers();
      await addLog('criou usuário', { email: email, name: options.data.name });
      return { data };
    } catch (error) {
      toast({ variant: "destructive", title: "Falha ao criar usuário", description: error.message });
      return { error };
    }
  }, [toast, user, addLog, refreshUsers]);

  const signIn = useCallback(async (email, password) => {
    let effectiveEmail = email;
    if (email.toLowerCase() === 'admin') effectiveEmail = 'admin@power-solis.dev';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: effectiveEmail, password });
      if (error) {
        toast({ variant: "destructive", title: t('loginFailureTitle'), description: t('loginFailureDescription') });
      } else if (data.user) {
        await handleSession(data.session);
        addLog('fez login');
        toast({ title: t('loginSuccessTitle'), description: t('loginSuccessDescription', { name: data.user.user_metadata?.name || 'Usuário' }) });
      }
      return { error };
    } catch (error) {
      toast({ variant: "destructive", title: "Erro de Rede", description: "Verifique sua conexão." });
      return { error };
    }
  }, [toast, addLog, t, handleSession]);

  const signOut = useCallback(async () => {
    if (user) await addLog('fez logout');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({ variant: "destructive", title: "Falha no logout", description: error.message });
      } else {
        setUser(null);
        setUsers([]);
        setLogs([]);
        toast({ title: t('logoutSuccessTitle'), description: t('logoutSuccessDescription') });
      }
      return { error };
    } catch (error) {
      return { error };
    }
  }, [toast, addLog, user, t]);
  
  const updateUser = useCallback(async (id, data) => {
    const profileData = { ...data };
    delete profileData.password;
    if (profileData.accessLevel) {
      profileData.access_level = profileData.accessLevel;
      delete profileData.accessLevel;
    }

    try {
      const { error: profileError } = await supabase.from('profiles').update(profileData).eq('id', id);
      if (profileError) {
        toast({ title: "Erro", description: "Falha ao atualizar perfil", variant: "destructive" });
        return false;
      }

      if (data.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(id, { password: data.password });
        if (passwordError) {
          toast({ title: "Erro", description: "Falha ao atualizar senha", variant: "destructive" });
          return false;
        }
      }
      
      await refreshUsers();
      await addLog('atualizou usuário', { userId: id, changes: Object.keys(data) });
      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso." });
      
      if (user?.id === id) {
        const { data: { session } } = await supabase.auth.refreshSession();
        await handleSession(session);
      }
      return true;
    } catch (error) {
      toast({ title: "Erro", description: "Falha na comunicação com o servidor", variant: "destructive" });
      return false;
    }
  }, [addLog, refreshUsers, toast, user, handleSession]);
  
  const updatePassword = useCallback(async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: "Erro", description: "Falha ao atualizar a senha.", variant: "destructive" });
        return false;
      }
      addLog('atualizou a própria senha');
      toast({ title: "Sucesso", description: "Senha atualizada com sucesso." });
      return true;
    } catch (error) {
      return false;
    }
  }, [addLog, toast]);

  const deleteUser = useCallback(async (userId) => {
    if (user?.accessLevel !== 3) {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para remover usuários.", variant: "destructive" });
      return;
    }
    if (userId === user.id) {
      toast({ title: "Ação Inválida", description: "Você não pode remover seu próprio usuário.", variant: "destructive" });
      return;
    }
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        toast({ variant: "destructive", title: "Erro ao remover usuário", description: error.message });
      } else {
        toast({ title: "Usuário removido", description: "O usuário foi removido com sucesso." });
        await refreshUsers();
        await addLog('removeu usuário', { userId: userId });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro de Conexão", description: "Falha ao remover usuário." });
    }
  }, [user, toast, addLog, refreshUsers]);

  const value = useMemo(() => ({
    user, users, logs, session, loading, signUp, signIn, signOut, 
    updateUser, updatePassword, deleteUser, refreshUsers, refreshLogs, addLog
  }), [user, users, logs, session, loading, signUp, signIn, signOut, updateUser, updatePassword, deleteUser, refreshUsers, refreshLogs, addLog]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};