import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Fingerprint, Save, Shield, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { useLifeExpectancyStandard } from '@/hooks/useLifeExpectancyStandard';

const ProfilePage = () => {
  const { user, updateUser, updatePassword } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { standard, updateStandard } = useLifeExpectancyStandard();

  const [name, setName] = useState(user?.name || '');
  const [localStandard, setLocalStandard] = useState(standard || 'IEEE C57.91-2011');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Sync standard when loaded
  React.useEffect(() => {
    if (standard) setLocalStandard(standard);
  }, [standard]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const success = await updateUser(user.id, { name });
    if (success) {
      toast({ title: t('profileUpdateSuccess') });
    } else {
      toast({ title: t('profileUpdateError'), variant: 'destructive' });
    }
  };

  const handleAdminSettingsUpdate = async (e) => {
    e.preventDefault();
    const success = await updateStandard(localStandard);
    if (success) {
      toast({ title: "Configurações salvas", description: "Padrão de cálculo atualizado com sucesso." });
    } else {
      toast({ title: "Erro", description: "Falha ao atualizar as configurações.", variant: 'destructive' });
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast({ title: "Senhas não conferem", variant: 'destructive' });
      return;
    }
    const success = await updatePassword(passwordData.newPassword);
    if (success) {
      toast({ title: t('passwordUpdateSuccess') });
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } else {
      toast({ title: t('passwordUpdateError'), description: "Verifique sua senha atual.", variant: 'destructive' });
    }
  };
  
  const getLevelText = (level) => {
    switch (level) {
      case 1: return t('levelViewer');
      case 2: return t('levelTechnician');
      case 3: return t('levelAdmin');
      default: return t('levelUser');
    }
  };


  return (
    <Layout>
      <Helmet>
        <title>{t('profileTitle')} - Power Solis</title>
        <meta name="description" content={t('profileSubtitle')} />
      </Helmet>
      
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <User className="h-8 w-8 mr-3 text-primary" />
            {t('profileTitle')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('profileSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('userInformation')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('fullName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <div className="relative">
                       <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" value={user?.email || ''} disabled className="pl-10 text-muted-foreground" />
                    </div>
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="registration">{t('registration')}</Label>
                     <div className="relative">
                       <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="registration" value={user?.registration || ''} disabled className="pl-10 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accessLevel">{t('accessLevel')}</Label>
                     <div className="relative">
                       <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="accessLevel" value={getLevelText(user?.accessLevel)} disabled className="pl-10 text-muted-foreground" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {t('updateProfile')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {user?.accessLevel === 3 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Shield className="w-5 h-5" /> Admin Settings
                  </CardTitle>
                  <CardDescription>Configurações globais do sistema de cálculo</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAdminSettingsUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="calcStandard" className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-muted-foreground" />
                        Padrão de Cálculo Padrão
                      </Label>
                      <Select value={localStandard} onValueChange={setLocalStandard}>
                        <SelectTrigger id="calcStandard" className="bg-background">
                          <SelectValue placeholder="Selecione o padrão" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IEEE C57.91-2011">IEEE C57.91-2011</SelectItem>
                          <SelectItem value="IEC60076-7">IEC60076-7</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Padrão
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>{t('changePassword')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('newPassword')}</Label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="newPassword" type="password" value={passwordData.newPassword} onChange={e => setPasswordData(p => ({...p, newPassword: e.target.value}))} className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">{t('confirmNewPassword')}</Label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="confirmNewPassword" type="password" value={passwordData.confirmNewPassword} onChange={e => setPasswordData(p => ({...p, confirmNewPassword: e.target.value}))} className="pl-10" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {t('updatePassword')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;