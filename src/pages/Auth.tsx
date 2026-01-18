import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, Loader2, User, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { useAuditLog } from '@/hooks/useAuditLog';

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

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logAction } = useAuditLog();

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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate('/', { replace: true });
        }
        setCheckingSession(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true });
      }
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
          description: "Sua conta foi criada com sucesso. Você já pode acessar a loja.",
        });
        // Log the signup action
        if (data.user) {
          await logSignupAction(data.user.id, email.trim());
        }
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
    setIsSignUp(!isSignUp);
    resetForm();
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            LEONOR
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? 'Crie sua conta para acessar a loja' : 'Acesse sua conta'}
          </p>
        </div>

        {/* Form */}
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

        {/* Toggle between login/signup */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          </p>
          <Button
            variant="link"
            onClick={toggleMode}
            className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
            disabled={loading}
          >
            {isSignUp ? 'Fazer login' : 'Criar conta'}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-muted-foreground relative z-10">
        © 2024 LEONOR Boutique. Todos os direitos reservados.
      </p>
    </div>
  );
};

export default Auth;
