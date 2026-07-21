import React, { useState } from 'react';
    import { Navigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useLanguage } from '@/contexts/LanguageContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
    import { useToast } from "@/components/ui/use-toast";

    const LoginPage = () => {
      const { user, signIn, loading: authLoading } = useAuth();
      const { t } = useLanguage();
      const { toast } = useToast();
      const [loginData, setLoginData] = useState({ email: '', password: '' });
      const [loading, setLoading] = useState(false);
      const [showLoginPassword, setShowLoginPassword] = useState(false);

      if (user) {
        return <Navigate to="/" replace />;
      }

      const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        await signIn(loginData.email, loginData.password);
        setLoading(false);
      };
      
      const handleForgotPassword = () => {
        toast({
          title: t('featureInProgressTitle'),
          description: t('featureInProgressDescription'),
        });
      };

      return (
        <>
          <Helmet>
            <title>Power Solis - Login</title>
            <meta name="description" content="Acesse a plataforma de monitoramento de transformadores Power Solis" />
          </Helmet>
          
          <div className="relative min-h-screen flex items-center justify-center p-4 bg-background">
             <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20">
              <img
                className="w-full h-full object-cover" 
                alt="Power transformer electrical infrastructure background" src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="relative z-10 w-full max-w-md"
            >
              <div className="text-center mb-8">
                 <Zap className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                 <h1 className="text-4xl font-bold gradient-text drop-shadow-lg mb-2">{t('loginWelcome')}</h1>
                 <p className="text-muted-foreground drop-shadow-md">{t('loginSubtitle')}</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{t('loginTitle')}</CardTitle>
                  <CardDescription>{t('loginDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="text"
                          placeholder="admin"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showLoginPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="pl-10 pr-10"
                          required
                        />
                        <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={loading || authLoading}
                    >
                      {(loading || authLoading) ? 'Entrando...' : t('loginButton')}
                    </Button>
                    <div className="text-center">
                      <button onClick={handleForgotPassword} type="button" className="text-sm text-primary hover:underline">
                        {t('forgotPassword')}
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      );
    };

    export default LoginPage;