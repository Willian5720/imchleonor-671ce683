import { RefreshCw, Zap } from 'lucide-react';
import { useFootballData } from '@/hooks/useFootballData';
import { LiveMatchCard } from '@/components/LiveMatchCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const LiveMatches = () => {
  const { liveFixtures, isLoading, refreshData } = useFootballData();

  // Group fixtures by league
  const fixturesByLeague = liveFixtures.reduce((acc, fixture) => {
    const league = fixture.league.name;
    if (!acc[league]) acc[league] = [];
    acc[league].push(fixture);
    return acc;
  }, {} as Record<string, typeof liveFixtures>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-destructive/20">
            <Zap className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Jogos Ao Vivo</h1>
            <p className="text-muted-foreground text-sm">
              {liveFixtures.length} partidas em andamento
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

      {/* Live Matches by League */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
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
                  <LiveMatchCard
                    key={fixture.fixture.id}
                    homeTeam={fixture.teams.home.name}
                    awayTeam={fixture.teams.away.name}
                    homeLogo={fixture.teams.home.logo}
                    awayLogo={fixture.teams.away.logo}
                    homeGoals={fixture.goals.home}
                    awayGoals={fixture.goals.away}
                    elapsed={fixture.fixture.status.elapsed}
                    league={fixture.league.name}
                    status={fixture.fixture.status.short}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-display font-semibold mb-2">
            Nenhum jogo ao vivo
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Não há partidas em andamento neste momento. Os jogos ao vivo aparecerão aqui automaticamente.
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveMatches;
