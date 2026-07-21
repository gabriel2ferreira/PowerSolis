import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { 
  LogOut,
  User,
  Zap,
  ChevronDown,
  Globe,
  Users,
  FileSearch,
  Sun,
  Moon,
  HardDrive,
  Home,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Layout = ({ children, showHeader = true }) => {
  const { user, signOut, addLog } = useAuth();
  const { t, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);
  
  const getUserLevelText = useCallback((level) => {
    switch (level) {
      case 1: return t('levelViewer');
      case 2: return t('levelTechnician');
      case 3: return t('levelAdmin');
      default: return t('levelUser');
    }
  }, [t]);

  const navigateTo = useCallback((path) => {
    addLog(`navegou para ${path}`);
    navigate(path);
  }, [addLog, navigate]);

  return (
    <div className="flex flex-col h-screen">
      {showHeader && (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-lg px-4 md:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('/')}>
              <Zap className="h-7 w-7 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold gradient-text">Power Solis</h1>
                <p className="text-xs text-muted-foreground -mt-1">{t('smartSolutions')}</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-2 ml-6">
               <Button 
                  variant={location.pathname === '/' ? "secondary" : "ghost"} 
                  onClick={() => navigateTo('/')}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>{t('home')}</span>
               </Button>
               <Button 
                  variant={location.pathname.startsWith('/equipment') || location.pathname.startsWith('/devices') ? "secondary" : "ghost"} 
                  onClick={() => navigateTo('/equipment')}
                  className="flex items-center gap-2"
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Gestão de Ativos</span>
               </Button>
               <Button 
                  variant={location.pathname === '/report-import' ? "secondary" : "ghost"} 
                  onClick={() => navigateTo('/report-import')}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{t('dataImport')}</span>
               </Button>
            </nav>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                  <span className="sr-only">{t('language')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('pt-BR')}>
                  Português
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 focus:ring-0 px-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:inline">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p>{user?.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{getUserLevelText(user?.accessLevel)}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigateTo('/equipment')} className="cursor-pointer md:hidden">
                  <HardDrive className="mr-2 h-4 w-4" />
                  <span>Gestão de Ativos</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigateTo('/report-import')} className="cursor-pointer md:hidden">
                  <Upload className="mr-2 h-4 w-4" />
                  <span>{t('dataImport')}</span>
                </DropdownMenuItem>
                {user?.accessLevel === 3 && (
                  <>
                    <DropdownMenuItem onClick={() => navigateTo('/user-management')} className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{t('userManagement')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigateTo('/access-logs')} className="cursor-pointer">
                      <FileSearch className="mr-2 h-4 w-4" />
                      <span>{t('accessLogs')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigateTo('/profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      )}
      
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;