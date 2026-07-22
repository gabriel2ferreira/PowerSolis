import React, { useState, useEffect } from 'react';
    import Layout from '@/components/Layout';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Users, UserPlus, Search, Shield, Edit, Trash2, Save, Eye, EyeOff } from 'lucide-react';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useLanguage } from '@/contexts/LanguageContext';

    const UserForm = ({ user, onSave, onCancel }) => {
        const { t } = useLanguage();
        const [formData, setFormData] = useState({
            name: user?.name || '',
            email: user?.email || '',
            registration: user?.registration || '',
            password: '',
            accessLevel: user?.accessLevel || 1,
        });
        const [showPassword, setShowPassword] = useState(false);
    
        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };
        
        const handleLevelChange = (value) => {
            setFormData(prev => ({...prev, accessLevel: parseInt(value)}));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('fullName')}</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={!!user} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="registration">{t('registration')}</Label>
                        <Input id="registration" name="registration" value={formData.registration} onChange={handleChange} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="accessLevel">{t('accessLevel')}</Label>
                        <Select onValueChange={handleLevelChange} defaultValue={String(formData.accessLevel)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('selectLevel')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">{t('levelViewer')}</SelectItem>
                                <SelectItem value="2">{t('levelTechnician')}</SelectItem>
                                <SelectItem value="3">{t('levelAdmin')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="password">{t('password')} {!user ? '' : t('passwordLeaveBlank')}</Label>
                    <div className="relative">
                        <Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required={!user} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
                    <Button type="submit"><Save className="h-4 w-4 mr-2" /> {t('save')}</Button>
                </DialogFooter>
            </form>
        );
    };

    const UserManagementPage = () => {
      const { users, signUp, updateUser, deleteUser, refreshUsers, user: currentUser } = useAuth();
      const { t } = useLanguage();
      const [searchTerm, setSearchTerm] = useState('');
      const [isFormOpen, setIsFormOpen] = useState(false);
      const [editingUser, setEditingUser] = useState(null);

      useEffect(() => {
        refreshUsers();
      }, [refreshUsers]);
      
      const handleAddNewUser = () => {
        setEditingUser(null);
        setIsFormOpen(true);
      };

      const handleEditUser = (user) => {
        setEditingUser(user);
        setIsFormOpen(true);
      };
      
      const handleSaveUser = async (formData) => {
        let success;
        if (editingUser) {
            const dataToUpdate = {
                name: formData.name,
                accessLevel: formData.accessLevel,
                registration: formData.registration,
            };
            if (formData.password) {
                dataToUpdate.password = formData.password;
            }
            success = await updateUser(editingUser.id, dataToUpdate);
        } else {
            success = await signUp(formData.email, formData.password, {
              data: {
                name: formData.name,
                registration: formData.registration,
                access_level: formData.accessLevel,
              }
            });
        }
        if(success) {
          setIsFormOpen(false);
          setEditingUser(null);
        }
      };
      
      const getLevelText = (level) => {
        switch (level) {
          case 1: return t('levelViewer');
          case 2: return t('levelTechnician');
          case 3: return t('levelAdmin');
          default: return 'Desconhecido';
        }
      };

      const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.registration?.toString().includes(searchTerm)
      );

      return (
        <Layout>
          <Helmet>
            <title>{t('userManagementTitle')} - Power Solis</title>
            <meta name="description" content={t('userManagementSubtitle')} />
          </Helmet>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold gradient-text flex items-center">
                    <Users className="h-8 w-8 mr-3 text-blue-500" />
                    {t('userManagementTitle')}
                  </h1>
                  <p className="text-muted-foreground mt-2">{t('userManagementSubtitle')}</p>
                </div>
                <DialogTrigger asChild>
                    <Button onClick={handleAddNewUser}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('addUser')}
                    </Button>
                </DialogTrigger>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex-1">
                        <CardTitle>{t('userList')}</CardTitle>
                         <CardDescription>
                            {t('totalUsersFound', {count: filteredUsers.length})}
                        </CardDescription>
                      </div>
                      <div className="relative w-full md:w-auto md:max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('searchPlaceholder')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredUsers.map(user => (
                        <div key={user.id} className="p-4 rounded-lg bg-background hover:bg-muted/50 border transition-colors">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                            <div className="col-span-2 md:col-span-1 flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{t('registration')}</p>
                              <p className="font-medium">{user.registration}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">{t('accessLevel')}</p>
                                <div className="flex items-center space-x-2">
                                <Shield className={`h-5 w-5 ${user.accessLevel === 3 ? 'text-red-500' : user.accessLevel === 2 ? 'text-yellow-500' : 'text-green-500'}`} />
                                <span className="font-medium">{getLevelText(user.accessLevel)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-end space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteUser(user.id)} disabled={user.id === currentUser.id}>
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{editingUser ? t('editUserTitle') : t('addUserTitle')}</DialogTitle>
                    <DialogDescription>
                        {editingUser ? t('editUserDescription') : t('addUserDescription')}
                    </DialogDescription>
                </DialogHeader>
                <UserForm 
                  user={editingUser} 
                  onSave={handleSaveUser} 
                  onCancel={() => setIsFormOpen(false)}
                />
            </DialogContent>
          </Dialog>
        </Layout>
      );
    };

    export default UserManagementPage;