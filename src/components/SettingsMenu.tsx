import { useState, useEffect } from 'react';
import { Settings, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePaymentSettings, PaymentGateway } from '@/hooks/usePaymentSettings';
import { useToast } from '@/hooks/use-toast';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsMenu = ({ isOpen, onClose }: SettingsMenuProps) => {
  const { 
    settings, 
    isLoaded,
    setActiveGateway, 
    updateStripeSettings, 
    updatePaypalSettings 
  } = usePaymentSettings();
  const { toast } = useToast();

  const [stripeEmail, setStripeEmail] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  // Sync local state with loaded settings
  useEffect(() => {
    if (isLoaded) {
      setStripeEmail(settings.stripe.email);
      setPaypalEmail(settings.paypal.email);
    }
  }, [isLoaded, settings.stripe.email, settings.paypal.email]);

  const handleSave = () => {
    updateStripeSettings({ email: stripeEmail });
    updatePaypalSettings({ email: paypalEmail });
    
    toast({
      title: "Configurações salvas!",
      description: `Email Stripe: ${stripeEmail || 'não configurado'}`,
    });
    
    onClose();
  };

  const handleGatewayChange = (gateway: PaymentGateway) => {
    setActiveGateway(gateway);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">
              Configurações
            </h2>
            <p className="text-muted-foreground text-sm">
              Gateways de Pagamento
            </p>
          </div>
        </div>

        {/* Gateway Selection */}
        <div className="mb-6">
          <Label className="text-sm text-muted-foreground mb-3 block">
            Gateway Ativo
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleGatewayChange('stripe')}
              className={`p-4 rounded-xl border-2 transition-all ${
                settings.activeGateway === 'stripe'
                  ? 'border-primary bg-primary/10 neon-glow-green'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                settings.activeGateway === 'stripe' ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <span className={`font-display font-bold text-sm ${
                settings.activeGateway === 'stripe' ? 'text-primary' : 'text-foreground'
              }`}>
                Stripe
              </span>
            </button>
            
            <button
              onClick={() => handleGatewayChange('paypal')}
              className={`p-4 rounded-xl border-2 transition-all ${
                settings.activeGateway === 'paypal'
                  ? 'border-secondary bg-secondary/10 neon-glow-purple'
                  : 'border-border bg-card hover:border-secondary/50'
              }`}
            >
              <svg 
                className={`w-6 h-6 mx-auto mb-2 ${
                  settings.activeGateway === 'paypal' ? 'text-secondary' : 'text-muted-foreground'
                }`}
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.636h6.94c2.287 0 3.87.57 4.703 1.695.752 1.017.954 2.37.6 4.026l-.014.075c-.67 3.59-2.96 5.424-6.82 5.424H8.93a.768.768 0 0 0-.757.636l-1.097 6.397Z"/>
              </svg>
              <span className={`font-display font-bold text-sm ${
                settings.activeGateway === 'paypal' ? 'text-secondary' : 'text-foreground'
              }`}>
                PayPal
              </span>
            </button>
          </div>
        </div>

        {/* Stripe Settings */}
        <div className={`mb-4 p-4 rounded-xl border transition-all ${
          settings.activeGateway === 'stripe' 
            ? 'border-primary/30 bg-primary/5' 
            : 'border-border bg-muted/20 opacity-50'
        }`}>
          <Label htmlFor="stripe-email" className="text-sm font-medium text-foreground mb-2 block">
            Email Stripe
          </Label>
          <Input
            id="stripe-email"
            type="email"
            placeholder="seu@email.com"
            value={stripeEmail}
            onChange={(e) => setStripeEmail(e.target.value)}
            className="bg-background border-border"
            disabled={settings.activeGateway !== 'stripe'}
          />
        </div>

        {/* PayPal Settings */}
        <div className={`mb-6 p-4 rounded-xl border transition-all ${
          settings.activeGateway === 'paypal' 
            ? 'border-secondary/30 bg-secondary/5' 
            : 'border-border bg-muted/20 opacity-50'
        }`}>
          <Label htmlFor="paypal-email" className="text-sm font-medium text-foreground mb-2 block">
            Email PayPal
          </Label>
          <Input
            id="paypal-email"
            type="email"
            placeholder="seu@paypal.com"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            className="bg-background border-border"
            disabled={settings.activeGateway !== 'paypal'}
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-display font-bold py-6 neon-glow-green hover:scale-[1.02] transition-transform"
        >
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};
