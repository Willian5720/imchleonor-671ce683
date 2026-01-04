import { RefreshCw, TrendingUp } from 'lucide-react';
import { useFootballData } from '@/hooks/useFootballData';
import { OddsCard } from '@/components/OddsCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Odds = () => {
  const {
    todayFixtures,
    odds,
    predictions,
    isLoading,
    refreshData,
    fetchPrediction,
  } = useFootballData();

  // Get match-winner odds (1X2)
  const getMatchOdds = (fixtureId: number) => {
    const fixtureOdds = odds.find(o => o.fixture.id === fixtureId);
    if (!fixtureOdds?.bookmakers?.[0]?.bets) return null;

    const matchWinner = fixtureOdds.bookmakers[0].bets.find(
      bet => bet.name === 'Match Winner'
    );
    if (!matchWinner) return null;

    return {
      home: matchWinner.values.find(v => v.value === 'Home')?.odd || '-',
      draw: matchWinner.values.find(v => v.value === 'Draw')?.odd || '-',
      away: matchWinner.values.find(v => v.value === 'Away')?.odd || '-',
    };
  };

  const upcomingFixtures = todayFixtures.filter(
    f => f.fixture.status.short === 'NS'
  );

  const fixturesWithOdds = upcomingFixtures.map(fixture => ({
    ...fixture,
    odds: getMatchOdds(fixture.fixture.id),
    prediction: predictions[fixture.fixture.id],
  })).filter(f => f.odds);

  // Group by league
  const fixturesByLeague = fixturesWithOdds.reduce((acc, fixture) => {
    const league = fixture.league.name;
    if (!acc[league]) acc[league] = [];
    acc[league].push(fixture);
    return acc;
  }, {} as Record<string, typeof fixturesWithOdds>);

  const handleLoadPrediction = async (fixtureId: number) => {
    await fetchPrediction(fixtureId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Probabilidades</h1>
            <p className="text-muted-foreground text-sm">
              {fixturesWithOdds.length} jogos com odds disponíveis
            </p>
          </div>
        </div>
        <Button
          onClick={refreshData}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Odds by League */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : Object.keys(fixturesByLeague).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(fixturesByLeague).map(([league, fixtures]) => (
            <section key={league}>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={fixtures[0].league.logo}
                  alt={league}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <h2 className="text-lg font-display font-semibold">{league}</h2>
                <span className="text-xs text-muted-foreground">
                  ({fixtures[0].league.country})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fixtures.map(fixture => (
                  <OddsCard
                    key={fixture.fixture.id}
                    homeTeam={fixture.teams.home.name}
                    awayTeam={fixture.teams.away.name}
                    homeLogo={fixture.teams.home.logo}
                    awayLogo={fixture.teams.away.logo}
                    homeOdd={fixture.odds!.home}
                    drawOdd={fixture.odds!.draw}
                    awayOdd={fixture.odds!.away}
                    homePercent={fixture.prediction?.predictions.percent.home}
                    drawPercent={fixture.prediction?.predictions.percent.draw}
                    awayPercent={fixture.prediction?.predictions.percent.away}
                    prediction={fixture.prediction?.predictions.advice}
                    onClick={() => handleLoadPrediction(fixture.fixture.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-display font-semibold mb-2">
            Nenhuma odd disponível
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            As cotações para os próximos jogos aparecerão aqui quando disponíveis.
          </p>
        </div>
      )}
    </div>
  );
};

export default Odds;
