import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle, Share, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-primary/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display neon-text-green">
              App Instalado!
            </CardTitle>
            <CardDescription>
              O NeonMiner já está instalado no seu dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Ir para o App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card border-primary/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl overflow-hidden neon-glow-green">
            <img src="/pwa-192x192.png" alt="NeonMiner" className="w-full h-full object-cover" />
          </div>
          <CardTitle className="text-2xl font-display neon-text-green">
            Instalar NeonMiner
          </CardTitle>
          <CardDescription>
            Adicione o app à tela inicial para uma experiência completa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Smartphone className="w-5 h-5 text-primary" />
              <span>Funciona offline</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Download className="w-5 h-5 text-primary" />
              <span>Carregamento rápido</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>Experiência de app nativo</span>
            </div>
          </div>

          {isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Para instalar no iOS:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="text-primary font-bold">1.</span>
                  <span>Toque no botão</span>
                  <Share className="w-4 h-4" />
                  <span>Compartilhar</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="text-primary font-bold">2.</span>
                  <span>Role e toque em "Adicionar à Tela de Início"</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="text-primary font-bold">3.</span>
                  <span>Confirme tocando em "Adicionar"</span>
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            <Button
              onClick={handleInstall}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-green"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Instalar Agora
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Para instalar no Android:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="text-primary font-bold">1.</span>
                  <span>Toque no menu</span>
                  <MoreVertical className="w-4 h-4" />
                  <span>do navegador</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="text-primary font-bold">2.</span>
                  <span>Selecione "Instalar app" ou "Adicionar à tela inicial"</span>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full border-border"
          >
            Continuar no Navegador
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
