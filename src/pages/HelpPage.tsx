import { useState, useRef, useEffect } from 'react';
import { HelpCircle, Mail, Phone, Send, Bot, User as UserIcon, Sparkles, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

const FAQ = [
  { q: 'Como faço o KYC?', a: 'Vá ao Perfil ou tente fazer uma transferência. O sistema pedirá foto da frente, verso do documento e uma selfie. A verificação é automática por IA.' },
  { q: 'Quanto vale 1 IMCH?', a: '1 IMCH Coin = 1 USD. Para conversão em Kwanza: 1000 AOA = 1 IMCH.' },
  { q: 'Existem taxas?', a: 'Não. A plataforma tem zero taxas em todas as conversões internas. Saques cripto externos podem ter taxas de rede blockchain.' },
  { q: 'Como conectar a Deriv?', a: 'No Perfil, clique no avatar da Deriv e siga as instruções para conectar a sua conta via API.' },
  { q: 'Esqueci a senha', a: 'Na tela de login, clique em "Esqueci minha senha" e siga o link enviado para o seu email.' },
  { q: 'Como receber suporte humano?', a: 'Email: imchleonor@gmail.com | Telefone: 943 723 434' },
];

export default function HelpPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Olá! 👋 Sou o assistente da IMCHLEONOR. Como posso ajudar hoje?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: 'user', content: text };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/help-chatbot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })) }),
        }
      );

      if (resp.status === 429) {
        toast.error('Muitas mensagens. Aguarde um momento.');
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error('Serviço temporariamente indisponível.');
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error('Erro ao conectar');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';
      let started = false;
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              if (!started) {
                started = true;
                setMessages((p) => [...p, { role: 'assistant', content: assistantText }]);
              } else {
                setMessages((p) => p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistantText } : m)));
              }
            }
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível obter resposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <HelpCircle className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Central de Ajuda</h1>
            <p className="text-sm text-muted-foreground">Estamos aqui para ajudar a qualquer momento</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar contactos + FAQ */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" /> Contacto Direto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href="mailto:imchleonor@gmail.com"
                  className="flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground">imchleonor@gmail.com</p>
                  </div>
                </a>
                <a
                  href="tel:+244943723434"
                  className="flex items-center gap-3 p-3 rounded-lg bg-card/60 border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm font-medium text-foreground">943 723 434</p>
                  </div>
                </a>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Perguntas Frequentes</CardTitle>
                <CardDescription>Respostas rápidas</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {FAQ.map((item, i) => (
                    <AccordionItem key={i} value={`q-${i}`}>
                      <AccordionTrigger className="text-sm text-left">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Chatbot */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-card/80 to-card border-border/50 flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="relative">
                  <Bot className="w-5 h-5 text-primary" />
                  <Sparkles className="w-3 h-3 text-primary absolute -top-1 -right-1" />
                </div>
                Assistente IMCHLEONOR
                <span className="ml-auto flex items-center gap-1 text-xs text-emerald-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </CardTitle>
              <CardDescription>Tira dúvidas sobre a plataforma 24/7</CardDescription>
            </CardHeader>

            <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted/60 text-foreground rounded-tl-sm border border-border/50'
                      }`}
                    >
                      {m.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                    {m.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-secondary/30 border border-border flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                    <div className="bg-muted/60 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/50 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Escreva a sua dúvida..."
                disabled={loading}
                className="bg-background/50"
              />
              <Button onClick={send} disabled={loading || !input.trim()} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
