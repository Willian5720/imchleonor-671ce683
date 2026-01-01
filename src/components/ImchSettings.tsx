import { useState } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ImchSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  threshold: number;
  onUpdateThreshold: (value: number) => Promise<boolean>;
}

export const ImchSettings = ({ isOpen, onClose, threshold, onUpdateThreshold }: ImchSettingsProps) => {
  const [newThreshold, setNewThreshold] = useState(threshold.toString());
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSave = async () => {
    const value = Number(newThreshold);
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Valor inválido",
        description: "O threshold deve ser um número maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const success = await onUpdateThreshold(value);
    setIsSaving(false);

    if (success) {
      toast({
        title: "Configurações salvas",
        description: `Novo threshold: ${value} USDT`,
      });
      onClose();
    } else {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar as configurações.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-xl text-foreground">
              Configurações
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="threshold" className="text-foreground">
              Threshold de Transferência Automática
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="threshold"
                type="number"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                min="1"
                step="1"
                className="bg-muted/50 border-border"
              />
              <span className="text-muted-foreground font-medium">USDT</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Quando seu saldo atingir este valor, a transferência para a Bybit será realizada automaticamente.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h3 className="font-medium text-primary text-sm mb-2">ℹ️ Como funciona</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 1 IMCH Coin = 1 USDT</li>
              <li>• Transferências são automáticas</li>
              <li>• Destino: Conta Funding da Bybit</li>
              <li>• 100% automático, sem ação manual</li>
            </ul>
          </div>
        </div>
        
        <div className="p-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-primary hover:bg-primary/90 font-display"
          >
            {isSaving ? (
              "Salvando..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
