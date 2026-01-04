import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface OddsCardProps {
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeOdd: string;
  drawOdd: string;
  awayOdd: string;
  homePercent?: string;
  drawPercent?: string;
  awayPercent?: string;
  prediction?: string;
  onClick?: () => void;
}

export const OddsCard = ({
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  homeOdd,
  drawOdd,
  awayOdd,
  homePercent,
  drawPercent,
  awayPercent,
  prediction,
  onClick,
}: OddsCardProps) => {
  const getOddColor = (odd: string) => {
    const value = parseFloat(odd);
    if (value < 1.5) return 'text-primary';
    if (value < 2.5) return 'text-secondary';
    return 'text-muted-foreground';
  };

  const getPercentIcon = (percent: string) => {
    const value = parseInt(percent);
    if (value > 45) return <TrendingUp className="w-3 h-3 text-primary" />;
    if (value < 25) return <TrendingDown className="w-3 h-3 text-destructive" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <div
      onClick={onClick}
      className="glass-card p-4 hover:border-primary/50 transition-all cursor-pointer"
    >
      {/* Teams */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1">
          <img
            src={homeLogo}
            alt={homeTeam}
            className="w-6 h-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          <span className="text-sm font-medium truncate">{homeTeam}</span>
        </div>
        <span className="text-xs text-muted-foreground mx-2">vs</span>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm font-medium truncate text-right">{awayTeam}</span>
          <img
            src={awayLogo}
            alt={awayTeam}
            className="w-6 h-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
      </div>

      {/* Odds */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-xs text-muted-foreground mb-1">Casa</div>
          <div className={`text-lg font-display font-bold ${getOddColor(homeOdd)}`}>
            {homeOdd}
          </div>
          {homePercent && (
            <div className="flex items-center justify-center gap-1 mt-1">
              {getPercentIcon(homePercent)}
              <span className="text-[10px] text-muted-foreground">{homePercent}</span>
            </div>
          )}
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-xs text-muted-foreground mb-1">Empate</div>
          <div className={`text-lg font-display font-bold ${getOddColor(drawOdd)}`}>
            {drawOdd}
          </div>
          {drawPercent && (
            <div className="flex items-center justify-center gap-1 mt-1">
              {getPercentIcon(drawPercent)}
              <span className="text-[10px] text-muted-foreground">{drawPercent}</span>
            </div>
          )}
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-xs text-muted-foreground mb-1">Fora</div>
          <div className={`text-lg font-display font-bold ${getOddColor(awayOdd)}`}>
            {awayOdd}
          </div>
          {awayPercent && (
            <div className="flex items-center justify-center gap-1 mt-1">
              {getPercentIcon(awayPercent)}
              <span className="text-[10px] text-muted-foreground">{awayPercent}</span>
            </div>
          )}
        </div>
      </div>

      {/* Prediction */}
      {prediction && (
        <div className="mt-3 p-2 rounded-lg bg-primary/10 border border-primary/30">
          <div className="text-xs text-muted-foreground mb-1">Previsão</div>
          <p className="text-sm text-primary font-medium">{prediction}</p>
        </div>
      )}
    </div>
  );
};
