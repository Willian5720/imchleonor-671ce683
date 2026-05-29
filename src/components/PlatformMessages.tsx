import { AlertCircle, Info, Megaphone, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePlatformMessages } from '@/hooks/usePlatformMessages';
import { useState } from 'react';

export function PlatformMessages() {
  const { data: messages, isLoading } = usePlatformMessages();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (isLoading || !messages || messages.length === 0) {
    return null;
  }

  const activeMessages = messages.filter(m => !dismissed.has(m.id));

  if (activeMessages.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissed(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-top-4">
      {activeMessages.map((msg) => {
        const isWarning = msg.type === 'warning';
        const isError = msg.type === 'error';
        
        return (
          <Alert 
            key={msg.id} 
            variant={isError ? 'destructive' : 'default'}
            className={`relative border ${
              isWarning 
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-500' 
                : isError 
                  ? '' 
                  : 'bg-primary/10 border-primary/30 text-primary'
            }`}
          >
            {isWarning ? (
              <AlertCircle className="w-4 h-4" />
            ) : isError ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Megaphone className="w-4 h-4" />
            )}
            
            <div className="flex-1 ml-2">
              {msg.title && <AlertTitle className="font-semibold">{msg.title}</AlertTitle>}
              <AlertDescription className="text-xs sm:text-sm mt-1 whitespace-pre-wrap">
                {msg.content}
              </AlertDescription>
            </div>
            
            <button 
              onClick={() => handleDismiss(msg.id)}
              className="absolute right-2 top-2 p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </Alert>
        );
      })}
    </div>
  );
}