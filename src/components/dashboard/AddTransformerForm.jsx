import React from 'react';
    import { useForm } from 'react-hook-form';
    import { useLanguage } from '@/contexts/LanguageContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { useToast } from '@/components/ui/use-toast';

    const AddTransformerForm = ({ setOpen }) => {
      const { t } = useLanguage();
      const { register, handleSubmit } = useForm();
      const { toast } = useToast();

      const onSubmit = (data) => {
        console.log(data);
        toast({
          title: "Formulário Enviado",
          description: "Os dados do transformador foram enviados (simulação).",
        });
        setOpen(false);
      };

      const fields = [
        // Electrical Characteristics
        { name: "application", label: "Aplicação / Application", type: "text" },
        { name: "maxVoltage", label: "Tensão Máxima / Maximum Voltage", type: "number", unit: "kV" },
        { name: "frequency", label: "Frequência / Frequency", type: "number", unit: "Hz" },
        { name: "maxSimpleRatio", label: "Máis Simples Relação Primária / Max. Simple Ratio", type: "number", unit: "A" },
        { name: "maxDoubleRatio", label: "Máx Dupla Relação Primária / Max. Double Ratio", type: "number", unit: "A" },
        { name: "ipn", label: "Ipn", type: "text" },
        { name: "ith", label: "Ith / Fth / It", type: "text", unit: "kA" },
        { name: "tempClass", label: "Classe de Temperatura / Temperature Class", type: "text", unit: "°C" },
        { name: "powerFreqWithstand", label: "Tensão Suport. a Freq. Ind. / Power Freq. Withstand Voltage", type: "number", unit: "kV" },
        { name: "nbi", label: "NBI / BIL", type: "number", unit: "kV" },
        { name: "accuracyClass", label: "Classe e Carga de Exatidão / Accuracy Class and Burden", type: "text" },
        // Constructive Characteristics
        { name: "primaryTerminals", label: "Terminais Primário / Primary Terminals", type: "text" },
        { name: "secondaryTerminals", label: "Terminais Secundário / Secondary Terminals", type: "text" },
        { name: "fixationBase", label: "Base de Fixação / Fixation Base", type: "text" },
        { name: "secondaryBox", label: "Caixa Secundária / Terminal Box", type: "text" },
        { name: "dome", label: "Domo / Dome", type: "text" },
        { name: "expansionBellows", label: "Fole de Expansão / Expansion Bellows", type: "text" },
        { name: "head", label: "Cabeça / Head", type: "text" },
        { name: "creepageDist", label: "Linha de Fuga / Creepage Dist.", type: "text", unit: "mm" },
        { name: "insulation", label: "Isolamento / Insulation", type: "text" },
        { name: "oilVolume", label: "Volume de Óleo / Oil Volume", type: "number", unit: "L" },
        { name: "dimensions", label: "Dimensões / Dimensions", type: "text" },
        { name: "weight", label: "Massa / Weight", type: "number", unit: "kg" },
      ];

      return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-6">
                <div className="space-y-4">
                    {fields.map(field => (
                        <div key={field.name} className="space-y-1">
                            <Label htmlFor={field.name}>{field.label}</Label>
                            <div className="relative">
                                <Input
                                    id={field.name}
                                    type={field.type}
                                    {...register(field.name)}
                                    className="pr-12"
                                />
                                {field.unit && <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{field.unit}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <div className="flex justify-end pt-4">
                <Button type="submit">Adicionar Equipamento</Button>
            </div>
        </form>
      );
    };

    export default AddTransformerForm;