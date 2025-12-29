import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'neon_miner_coins';
const PIN_ATTEMPTS_KEY = 'neon_miner_attempts';
const COIN_VALUE_EUR = 100;

export const useGameState = () => {
  const [coins, setCoins] = useState<number>(0);
  const [pinAttempts, setPinAttempts] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedCoins = localStorage.getItem(STORAGE_KEY);
    const savedAttempts = localStorage.getItem(PIN_ATTEMPTS_KEY);
    
    if (savedCoins) {
      setCoins(parseFloat(savedCoins));
    }
    if (savedAttempts) {
      setPinAttempts(parseInt(savedAttempts, 10));
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, coins.toString());
    }
  }, [coins, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(PIN_ATTEMPTS_KEY, pinAttempts.toString());
    }
  }, [pinAttempts, isLoaded]);

  const addCoin = useCallback(() => {
    setCoins(prev => prev + 1);
  }, []);

  const resetCoins = useCallback(() => {
    setCoins(0);
  }, []);

  const getEuroValue = useCallback(() => {
    return coins * COIN_VALUE_EUR;
  }, [coins]);

  const incrementPinAttempts = useCallback(() => {
    const newAttempts = pinAttempts + 1;
    setPinAttempts(newAttempts);
    
    if (newAttempts >= 3) {
      // Reset everything after 3 failed attempts
      setCoins(0);
      setPinAttempts(0);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PIN_ATTEMPTS_KEY);
      return true; // Indicates wipe occurred
    }
    return false;
  }, [pinAttempts]);

  const resetPinAttempts = useCallback(() => {
    setPinAttempts(0);
  }, []);

  return {
    coins,
    addCoin,
    resetCoins,
    getEuroValue,
    pinAttempts,
    incrementPinAttempts,
    resetPinAttempts,
    isLoaded,
    COIN_VALUE_EUR,
  };
};
