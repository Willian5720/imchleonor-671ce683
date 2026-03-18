import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, Loader2, User, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { TwoFactorVerification } from '@/components/auth/TwoFactorVerification';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
});

const signupSchema = authSchema.extend({
  name: z.string().trim().min(2, { message: "Nome deve ter no mínimo 2 caracteres" }).max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type AuthStep = 'login' | 'signup' | '2fa-verify' | '2fa-setup';

const Auth = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const logLoginAction = useCallback(async (userId: string) => {
    try {
      const jsonDetails = JSON.parse(JSON.stringify({ method: 'email' }));
      await supabase.rpc('log_user_action', {
        p_user_id: userId,
        p_action: 'login',
        p_entity_type: 'auth',
        p_entity_id: null,
        p_details: jsonDetails
      });
    } catch (err) {
      console.error('Error logging login:', err);
    }
  }, []);

  const logSignupAction = useCallback(async (userId: string, userEmail: string) => {
    try {
      const jsonDetails = JSON.parse(JSON.stringify({ email: userEmail }));
      await supabase.rpc('log_user_action', {
        p_user_id: userId,
        p_action: 'signup',
        p_entity_type: 'auth',
        p_entity_id: null,
        p_details: jsonDetails
      });
    } catch (err) {
      console.error('Error logging signup:', err);
    }
  }, []);

  const check2FAAndNavigate = useCallback(async () => {
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          await check2FAAndNavigate();
        } else if (!session && event === 'SIGNED_OUT') {
          setStep('login');
          setCheckingSession(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await check2FAAndNavigate();
      } else {
        setCheckingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, check2FAAndNavigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      toast({
        title: "Erro de validação",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast({
          title: "Erro de Login",
          description: error.message === "Invalid login credentials" 
            ? "Email ou senha incorretos."
            : error.message,
          variant: "destructive",
        });
      } else if (data.user) {
        // Log the login action
        await logLoginAction(data.user.id);
        // 2FA check will be handled by auth state change
      }
    } catch {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao fazer login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      toast({
        title: "Erro de validação",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (error) {
        toast({
          title: "Erro no Cadastro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Sua conta foi criada. Agora configure a autenticação 2FA.",
        });
        // Log the signup action
        if (data.user) {
          await logSignupAction(data.user.id, email.trim());
        }
        // 2FA setup will be handled by auth state change
      }
    } catch {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a conta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const toggleMode = () => {
    setStep(step === 'signup' ? 'login' : 'signup');
    resetForm();
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      
      if (error) {
        toast({
          title: "Erro no Login com Google",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao fazer login com Google.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handle2FASuccess = () => {
    navigate('/', { replace: true });
  };

  const handle2FACancel = () => {
    setStep('login');
    resetForm();
    setCheckingSession(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSignUp = step === 'signup';
  const is2FAVerify = step === '2fa-verify';
  const is2FASetup = step === '2fa-setup';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Auth card */}
      <div className="glass-card p-8 w-full max-w-md relative z-10">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display neon-text-green">
            IMCHLEONOR
          </h1>
          {!is2FAVerify && !is2FASetup && (
            <p className="text-muted-foreground mt-2">
              {isSignUp ? 'Crie sua conta para acessar a exchange' : 'Acesse sua conta'}
            </p>
          )}
        </div>

        {/* 2FA Verification Step */}
        {is2FAVerify && (
          <TwoFactorVerification 
            onSuccess={handle2FASuccess} 
            onCancel={handle2FACancel} 
          />
        )}

        {/* 2FA Setup Step */}
        {is2FASetup && (
          <TwoFactorSetup 
            onSuccess={handle2FASuccess} 
            onCancel={handle2FACancel} 
          />
        )}

        {/* Login/Signup Form */}
        {!is2FAVerify && !is2FASetup && (
          <>
            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Nome
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-background/50 border-border focus:border-primary"
                      disabled={loading}
                      maxLength={100}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-border focus:border-primary"
                    disabled={loading}
                    maxLength={255}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-border focus:border-primary"
                    disabled={loading}
                    maxLength={100}
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-background/50 border-border focus:border-primary"
                      disabled={loading}
                      maxLength={100}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display neon-glow-green"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? 'Criando conta...' : 'Entrando...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Criar Conta' : 'Entrar'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-border hover:bg-accent"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {googleLoading ? 'Conectando...' : 'Continuar com Google'}
            </Button>

            {/* Toggle between login/signup */}
            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
              </p>
              <Button
                variant="link"
                onClick={toggleMode}
                className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
                disabled={loading || googleLoading}
              >
                {isSignUp ? 'Fazer login' : 'Criar conta'}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground relative z-10">
        © 2024 IMCHLEONOR. Todos os direitos reservados.
      </p>
    </div>
  );
};

export default Auth;
