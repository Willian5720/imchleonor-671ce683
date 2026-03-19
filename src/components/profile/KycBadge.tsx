import { Badge } from '@/components/ui/badge';
import { useKycStatus } from '@/hooks/useKycStatus';
import { ShieldCheck, Clock, ShieldX, ShieldAlert } from 'lucide-react';

export function KycBadge() {
  const { isVerified, isPending, isRejected, hasSubmitted, loading } = useKycStatus();

  if (loading) return null;

  if (isVerified) {
    return (
      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-green-500/50 text-green-500 gap-1">
        <ShieldCheck className="w-3 h-3" /> Verificado
      </Badge>
    );
  }

  if (isPending) {
    return (
      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-500/50 text-amber-500 gap-1">
        <Clock className="w-3 h-3" /> Em análise
      </Badge>
    );
  }

  if (isRejected) {
    return (
      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-destructive/50 text-destructive gap-1">
        <ShieldX className="w-3 h-3" /> Rejeitado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-muted-foreground/50 text-muted-foreground gap-1">
      <ShieldAlert className="w-3 h-3" /> Não verificado
    </Badge>
  );
}
