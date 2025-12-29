import { useState, useEffect, useCallback } from 'react';

const PAYMENT_SETTINGS_KEY = 'neon_miner_payment_settings';

export type PaymentGateway = 'stripe' | 'paypal';

export interface PaymentSettings {
  activeGateway: PaymentGateway;
  stripe: {
    email: string;
  };
  paypal: {
    email: string;
  };
}

const defaultSettings: PaymentSettings = {
  activeGateway: 'stripe',
  stripe: {
    email: '',
  },
  paypal: {
    email: '',
  },
};

export const usePaymentSettings = () => {
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(PAYMENT_SETTINGS_KEY);
    
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch {
        setSettings(defaultSettings);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  const updateSettings = useCallback((newSettings: Partial<PaymentSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateStripeSettings = useCallback((stripeSettings: Partial<PaymentSettings['stripe']>) => {
    setSettings(prev => ({
      ...prev,
      stripe: { ...prev.stripe, ...stripeSettings },
    }));
  }, []);

  const updatePaypalSettings = useCallback((paypalSettings: Partial<PaymentSettings['paypal']>) => {
    setSettings(prev => ({
      ...prev,
      paypal: { ...prev.paypal, ...paypalSettings },
    }));
  }, []);

  const setActiveGateway = useCallback((gateway: PaymentGateway) => {
    setSettings(prev => ({ ...prev, activeGateway: gateway }));
  }, []);

  return {
    settings,
    isLoaded,
    updateSettings,
    updateStripeSettings,
    updatePaypalSettings,
    setActiveGateway,
  };
};
