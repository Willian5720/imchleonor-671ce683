import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface Odds {
  fixture: {
    id: number;
  };
  bookmakers: Array<{
    name: string;
    bets: Array<{
      name: string;
      values: Array<{
        value: string;
        odd: string;
      }>;
    }>;
  }>;
}

interface Prediction {
  predictions: {
    winner: {
      id: number;
      name: string;
      comment: string;
    };
    win_or_draw: boolean;
    under_over: string;
    goals: {
      home: string;
      away: string;
    };
    advice: string;
    percent: {
      home: string;
      draw: string;
      away: string;
    };
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
}

export const useFootballData = () => {
  const [liveFixtures, setLiveFixtures] = useState<Fixture[]>([]);
  const [todayFixtures, setTodayFixtures] = useState<Fixture[]>([]);
  const [odds, setOdds] = useState<Odds[]>([]);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFromApi = useCallback(async (action: string, params?: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase.functions.invoke('football-api', {
        body: { action, params },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`Error fetching ${action}:`, err);
      throw err;
    }
  }, []);

  const fetchLiveFixtures = useCallback(async () => {
    try {
      const data = await fetchFromApi('live');
      setLiveFixtures(data.response || []);
    } catch (err) {
      console.error('Error fetching live fixtures:', err);
    }
  }, [fetchFromApi]);

  const fetchTodayFixtures = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await fetchFromApi('fixtures', { date: today });
      setTodayFixtures(data.response || []);
    } catch (err) {
      console.error('Error fetching today fixtures:', err);
    }
  }, [fetchFromApi]);

  const fetchOdds = useCallback(async (fixtureId?: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const params: Record<string, unknown> = { date: today };
      if (fixtureId) params.fixture = fixtureId;
      
      const data = await fetchFromApi('odds', params);
      setOdds(data.response || []);
    } catch (err) {
      console.error('Error fetching odds:', err);
    }
  }, [fetchFromApi]);

  const fetchPrediction = useCallback(async (fixtureId: number) => {
    try {
      const data = await fetchFromApi('predictions', { fixture: fixtureId });
      if (data.response?.[0]) {
        setPredictions(prev => ({ ...prev, [fixtureId]: data.response[0] }));
      }
      return data.response?.[0];
    } catch (err) {
      console.error('Error fetching prediction:', err);
      return null;
    }
  }, [fetchFromApi]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchLiveFixtures(),
        fetchTodayFixtures(),
        fetchOdds(),
      ]);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [fetchLiveFixtures, fetchTodayFixtures, fetchOdds]);

  useEffect(() => {
    refreshData();
    
    // Auto-refresh live fixtures every 60 seconds
    const interval = setInterval(fetchLiveFixtures, 60000);
    return () => clearInterval(interval);
  }, [refreshData, fetchLiveFixtures]);

  return {
    liveFixtures,
    todayFixtures,
    odds,
    predictions,
    isLoading,
    error,
    refreshData,
    fetchPrediction,
  };
};
