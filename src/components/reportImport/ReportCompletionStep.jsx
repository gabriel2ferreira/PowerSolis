import React from 'react';
import { CheckCircle2, Package, Database, FileText, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const ReportCompletionStep = ({ result, onReset }) => {
  const isNewEquipment = result.action === 'created';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Passo 3 de 3: Concluído</h2>
        <p className="text-muted-foreground">
          Importação realizada com sucesso!
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {isNewEquipment ? 'Equipamento Criado!' : 'Dados Adicionados!'}
                </h3>
                <p className="text-muted-foreground">
                  {isNewEquipment
                    ? 'Um novo equipamento foi criado com sucesso'
                    : 'Os dados foram adicionados ao equipamento existente'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b">
              {isNewEquipment ? (
                <Package className="w-5 h-5 text-primary" />
              ) : (
                <Database className="w-5 h-5 text-primary" />
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isNewEquipment ? 'Novo Equipamento' : 'Equipamento Atualizado'}
                </p>
                <p className="text-lg font-semibold">{result.equipment?.name}</p>
              </div>
            </div>

            <div className="grid gap-3">
              {result.equipment?.equipment_types?.name && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <span className="text-sm font-medium">{result.equipment.equipment_types.name}</span>
                </div>
              )}
              
              {result.equipment?.manufacturer && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Fabricante</span>
                  <span className="text-sm font-medium">{result.equipment.manufacturer}</span>
                </div>
              )}
              
              {result.equipment?.model && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Modelo</span>
                  <span className="text-sm font-medium">{result.equipment.model}</span>
                </div>
              )}
              
              {result.equipment?.serial_number && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Número de Série</span>
                  <span className="text-sm font-medium">{result.equipment.serial_number}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Importado de: {result.fileName}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
          <Button onClick={onReset} variant="outline" size="lg">
            <RotateCw className="w-4 h-4 mr-2" />
            Importar Outro Relatório
          </Button>
          
          <Button onClick={onReset} size="lg">
            Concluir Importação
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportCompletionStep;