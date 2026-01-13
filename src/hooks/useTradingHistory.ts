import { useState, useCallback } from 'react';

export interface TradeOrder {
  id: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop-limit';
  amount: number;
  price: number;
  total: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  limitPrice?: number;
  stopPrice?: number;
  createdAt: Date;
  filledAt?: Date;
}

export interface PriceHistoryPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const STORAGE_KEY = 'crypto_trading_history';

export function useTradingHistory() {
  const [orders, setOrders] = useState<TradeOrder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          filledAt: order.filledAt ? new Date(order.filledAt) : undefined,
        }));
      }
    } catch (e) {
      console.error('Failed to load trading history:', e);
    }
    return [];
  });

  const saveOrders = useCallback((newOrders: TradeOrder[]) => {
    setOrders(newOrders);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
    } catch (e) {
      console.error('Failed to save trading history:', e);
    }
  }, []);

  const addOrder = useCallback((order: Omit<TradeOrder, 'id' | 'createdAt' | 'status'>) => {
    const newOrder: TradeOrder = {
      ...order,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      status: order.orderType === 'market' ? 'filled' : 'pending',
      filledAt: order.orderType === 'market' ? new Date() : undefined,
    };
    
    const newOrders = [newOrder, ...orders];
    saveOrders(newOrders);
    return newOrder;
  }, [orders, saveOrders]);

  const cancelOrder = useCallback((orderId: string) => {
    const newOrders = orders.map(order => 
      order.id === orderId && order.status === 'pending'
        ? { ...order, status: 'cancelled' as const }
        : order
    );
    saveOrders(newOrders);
  }, [orders, saveOrders]);

  const fillOrder = useCallback((orderId: string) => {
    const newOrders = orders.map(order => 
      order.id === orderId && order.status === 'pending'
        ? { ...order, status: 'filled' as const, filledAt: new Date() }
        : order
    );
    saveOrders(newOrders);
  }, [orders, saveOrders]);

  const clearHistory = useCallback(() => {
    saveOrders([]);
  }, [saveOrders]);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const filledOrders = orders.filter(o => o.status === 'filled');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled' || o.status === 'expired');

  return {
    orders,
    pendingOrders,
    filledOrders,
    cancelledOrders,
    addOrder,
    cancelOrder,
    fillOrder,
    clearHistory,
  };
}
