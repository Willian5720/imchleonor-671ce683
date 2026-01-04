import { LucideIcon } from 'lucide-react';

interface StatsWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'secondary' | 'destructive';
}

export const StatsWidget = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
}: StatsWidgetProps) => {
  const colorClasses = {
    primary: 'text-primary border-primary/30 bg-primary/10',
    secondary: 'text-secondary border-secondary/30 bg-secondary/10',
    destructive: 'text-destructive border-destructive/30 bg-destructive/10',
  };

  const iconBgClasses = {
    primary: 'bg-primary/20',
    secondary: 'bg-secondary/20',
    destructive: 'bg-destructive/20',
  };

  return (
    <div className="glass-card p-4 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${iconBgClasses[color]}`}>
        <Icon className={`w-6 h-6 ${colorClasses[color].split(' ')[0]}`} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-display font-bold">{value}</span>
          {trend && (
            <span
              className={`text-xs ${
                trend === 'up'
                  ? 'text-primary'
                  : trend === 'down'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–'}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
