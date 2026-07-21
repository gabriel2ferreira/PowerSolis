import React, { useState, useEffect } from 'react';
    import Layout from '@/components/Layout';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { FileSearch, Search } from 'lucide-react';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useLanguage } from '@/contexts/LanguageContext';
    import { format } from 'date-fns';
    import { ptBR, enUS } from 'date-fns/locale';

    const AccessLogsPage = () => {
      const { logs, refreshLogs } = useAuth();
      const { t, language } = useLanguage();
      const [searchTerm, setSearchTerm] = useState('');
      
      useEffect(() => {
        refreshLogs();
      }, [refreshLogs]);

      const filteredLogs = logs.filter(log =>
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const locale = language === 'pt-BR' ? ptBR : enUS;

      return (
        <Layout>
          <Helmet>
            <title>{t('accessLogsTitle')} - Power Solis</title>
            <meta name="description" content={t('accessLogsSubtitle')} />
          </Helmet>
          
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold gradient-text flex items-center">
                <FileSearch className="h-8 w-8 mr-3 text-blue-500" />
                {t('accessLogsTitle')}
              </h1>
              <p className="text-muted-foreground mt-2">{t('accessLogsSubtitle')}</p>
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
                          {t('totalLogsFound', { count: filteredLogs.length })}
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
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6">{t('logDate')}</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold">{t('logUser')}</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold">{t('logAction')}</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold">{t('logDetails')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-background">
                        {filteredLogs.map(log => (
                          <tr key={log.id} className="hover:bg-muted/50">
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                              {format(new Date(log.created_at), 'Ppp', { locale })}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{log.user_name}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{log.action}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                              {log.details && Object.keys(log.details).length > 0 ? 
                                <pre className="text-xs bg-muted p-2 rounded-md">{JSON.stringify(log.details, null, 2)}</pre> 
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </Layout>
      );
    };

    export default AccessLogsPage;