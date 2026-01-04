import { Zap } from 'lucide-react';

interface LiveMatchCardProps {
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeGoals: number | null;
  awayGoals: number | null;
  elapsed: number | null;
  league: string;
  status: string;
  onClick?: () => void;
}

export const LiveMatchCard = ({
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  homeGoals,
  awayGoals,
  elapsed,
  league,
  status,
  onClick,
}: LiveMatchCardProps) => {
  const isLive = status === '1H' || status === '2H' || status === 'HT';

  return (
    <div
      onClick={onClick}
      className="glass-card p-4 hover:border-primary/50 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground truncate max-w-[60%]">
          {league}
        </span>
        {isLive && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <Zap className="w-3 h-3 animate-pulse" />
            <span className="font-medium">{elapsed}'</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Home Team */}
        <div className="flex-1 flex items-center gap-2">
          <img
            src={homeLogo}
            alt={homeTeam}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          <span className="text-sm font-medium truncate">{homeTeam}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-muted/50">
          <span className="text-lg font-display font-bold">
            {homeGoals ?? '-'}
          </span>
          <span className="text-muted-foreground">:</span>
          <span className="text-lg font-display font-bold">
            {awayGoals ?? '-'}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-sm font-medium truncate text-right">{awayTeam}</span>
          <img
            src={awayLogo}
            alt={awayTeam}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center">
        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Ver detalhes →
        </span>
      </div>
    </div>
  );
};
