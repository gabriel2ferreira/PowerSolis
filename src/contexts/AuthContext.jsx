import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
    import { toast } from '@/components/ui/use-toast';

    const AuthContext = createContext();

    export const useAuth = () => {
      const context = useContext(AuthContext);
      if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
      }
      return context;
    };

    const initialAdmin = {
      id: 1,
      uuid: '00000000-0000-0000-0000-000000000001',
      name: 'Admin',
      email: 'admin',
      registration: '000000',
      password: 'admin123',
      accessLevel: 3, // Administrador
      createdAt: new Date().toISOString()
    };
    
    const addLogEntry = (user, action, details) => {
        if (!user) return;
        const logs = JSON.parse(localStorage.getItem('powerSolisLogs') || '[]');
        const newLog = {
            id: Date.now(),
            userId: user.id,
            userName: user.name,
            action,
            details: details || null,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('pt-BR'),
            time: new Date().toLocaleTimeString('pt-BR')
        };
        logs.unshift(newLog);
        localStorage.setItem('powerSolisLogs', JSON.stringify(logs));
    };


    export const AuthProvider = ({ children }) => {
      const [user, setUser] = useState(null);
      const [users, setUsers] = useState([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const storedUsers = JSON.parse(localStorage.getItem('powerSolisUsers') || '[]');
        if (storedUsers.length === 0) {
          storedUsers.push(initialAdmin);
          localStorage.setItem('powerSolisUsers', JSON.stringify(storedUsers));
        } else {
          // Garante que o admin sempre exista e esteja atualizado (senha, etc)
          const adminExists = storedUsers.some(u => u.email === 'admin');
          if (!adminExists) {
            storedUsers.unshift(initialAdmin);
            localStorage.setItem('powerSolisUsers', JSON.stringify(storedUsers));
          }
        }
        setUsers(storedUsers);

        const storedUser = localStorage.getItem('powerSolisUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        setLoading(false);
      }, []);
      
      const refreshUsers = useCallback(() => {
        const storedUsers = JSON.parse(localStorage.getItem('powerSolisUsers') || '[]');
        setUsers(storedUsers);
      }, []);
      
      const addLog = useCallback((action, details) => {
        addLogEntry(user, action, details);
      }, [user]);

      const login = async (email, password) => {
        try {
          const currentUsers = JSON.parse(localStorage.getItem('powerSolisUsers') || '[]');
          const foundUser = currentUsers.find(u => u.email === email && u.password === password);
          
          if (!foundUser) {
            throw new Error('Credenciais inválidas');
          }
          
          addLogEntry(foundUser, 'fez login');

          const userSession = { ...foundUser };
          delete userSession.password;
          
          setUser(userSession);
          localStorage.setItem('powerSolisUser', JSON.stringify(userSession));
          
          toast({
            title: "Login realizado com sucesso!",
            description: `Bem-vindo, ${foundUser.name}!`,
          });
          
          return true;
        } catch (error) {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
      };

      const createUser = async (userData) => {
        if (user?.accessLevel !== 3) {
            toast({ title: "Acesso Negado", description: "Você não tem permissão para criar usuários.", variant: "destructive" });
            return false;
        }

        try {
          const currentUsers = JSON.parse(localStorage.getItem('powerSolisUsers') || '[]');
          
          if (currentUsers.find(u => u.email === userData.email)) {
            throw new Error('Email já cadastrado');
          }
          
          if (currentUsers.find(u => u.registration === userData.registration)) {
            throw new Error('Matrícula já cadastrada');
          }

          const newUser = {
            id: Date.now(),
            uuid: crypto.randomUUID(),
            ...userData,
            createdAt: new Date().toISOString()
          };

          currentUsers.push(newUser);
          localStorage.setItem('powerSolisUsers', JSON.stringify(currentUsers));
          refreshUsers();
          
          addLog('criou usuário', { name: newUser.name, email: newUser.email });

          toast({
            title: "Usuário criado com sucesso!",
            description: `O usuário ${newUser.name} foi adicionado.`,
          });
          
          return true;
        } catch (error) {
          toast({
            title: "Erro ao criar usuário",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
      };

      const logout = () => {
        addLog('fez logout');
        setUser(null);
        localStorage.removeItem('powerSolisUser');
        toast({
          title: "Logout realizado",
          description: "Até logo!",
        });
      };
      
      const updateUser = (userId, updatedData) => {
        if (user?.accessLevel !== 3) {
            toast({ title: "Acesso Negado", description: "Você não tem permissão para editar usuários.", variant: "destructive" });
            return false;
        }
        let currentUsers = JSON.parse(localStorage.getItem('powerSolisUsers') || '[]');
        const targetUser = currentUsers.find(u => u.id === userId);
        if (!targetUser) return false;

        currentUsers = currentUsers.map(u => (u.id === userId ? { ...u, ...updatedData } : u));
        localStorage.setItem('powerSolisUsers', JSON.stringify(currentUsers));
        refreshUsers();

        addLog('atualizou usuário', { name: targetUser.name, changes: Object.keys(updatedData) });
        toast({ title: "Usuário atualizado!", description: "Os dados do usuário foram salvos." });
        return true;
      };

      const deleteUser = (userId) => {
          if (user?.accessLevel !== 3) {
              toast({ title: "Acesso Negado", description: "Você não tem permissão para remover usuários.", variant: "destructive" });
              return false;
          }
          if (userId === user.id) {
              toast({ title: "Ação Inválida", description: "Você não pode remover seu próprio usuário.", variant: "destructive" });
              return false;
          }
          let currentUsers = JSON.parse(localStorage.getItem('powerSolisUsers') || '[]');
          const targetUser = currentUsers.find(u => u.id === userId);
          if (!targetUser) return false;

          currentUsers = currentUsers.filter(u => u.id !== userId);
          localStorage.setItem('powerSolisUsers', JSON.stringify(currentUsers));
          refreshUsers();
          
          addLog('removeu usuário', { name: targetUser.name, email: targetUser.email });
          toast({ title: "Usuário removido!", description: "O usuário foi removido com sucesso.", variant: "destructive" });
          return true;
      };

      const value = {
        user,
        users,
        login,
        logout,
        loading,
        createUser,
        updateUser,
        deleteUser,
        refreshUsers,
        addLog,
      };

      return (
        <AuthContext.Provider value={value}>
          {children}
        </AuthContext.Provider>
      );
    };