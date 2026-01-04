import { RefreshCw, Zap, Calendar, TrendingUp, Activity } from 'lucide-react';
import { useFootballData } from '@/hooks/useFootballData';
import { LiveMatchCard } from '@/components/LiveMatchCard';
import { OddsCard } from '@/components/OddsCard';
import { StatsWidget } from '@/components/StatsWidget';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const {
    liveFixtures,
    todayFixtures,
    odds,
    isLoading,
    refreshData,
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
  ).slice(0, 6);

  const fixturesWithOdds = upcomingFixtures.map(fixture => ({
    ...fixture,
    odds: getMatchOdds(fixture.fixture.id),
  })).filter(f => f.odds);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Estatísticas e probabilidades em tempo real
          </p>
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

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsWidget
          title="Jogos Ao Vivo"
          value={liveFixtures.length}
          subtitle="Partidas em andamento"
          icon={Zap}
          color="destructive"
        />
        <StatsWidget
          title="Jogos Hoje"
          value={todayFixtures.length}
          subtitle="Total de partidas"
          icon={Calendar}
          color="primary"
        />
        <StatsWidget
          title="Com Odds"
          value={fixturesWithOdds.length}
          subtitle="Jogos com cotações"
          icon={TrendingUp}
          color="secondary"
        />
        <StatsWidget
          title="Taxa Atualização"
          value="60s"
          subtitle="Dados ao vivo"
          icon={Activity}
          color="primary"
        />
      </div>

      {/* Live Matches */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-display font-semibold">Jogos Ao Vivo</h2>
          {liveFixtures.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded-full">
              {liveFixtures.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : liveFixtures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveFixtures.slice(0, 6).map(fixture => (
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
        ) : (
          <div className="glass-card p-8 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              Nenhum jogo ao vivo no momento
            </p>
          </div>
        )}
      </section>

      {/* Upcoming Matches with Odds */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-display font-semibold">Próximos Jogos - Odds</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : fixturesWithOdds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fixturesWithOdds.map(fixture => (
              <OddsCard
                key={fixture.fixture.id}
                homeTeam={fixture.teams.home.name}
                awayTeam={fixture.teams.away.name}
                homeLogo={fixture.teams.home.logo}
                awayLogo={fixture.teams.away.logo}
                homeOdd={fixture.odds!.home}
                drawOdd={fixture.odds!.draw}
                awayOdd={fixture.odds!.away}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              Nenhuma odd disponível no momento
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
