import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Política de Privacidade</h1>
            <p className="text-sm text-muted-foreground">Como tratamos os seus dados</p>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
          <CardContent className="p-6 space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-primary mb-2">1. Dados que Recolhemos</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Dados de conta:</strong> nome, email, telefone, foto de perfil;</li>
                <li><strong>Dados de KYC:</strong> documento de identidade, selfie, data de nascimento;</li>
                <li><strong>Dados financeiros:</strong> saldos, transações, endereços de carteira;</li>
                <li><strong>Dados técnicos:</strong> IP, navegador, registos de auditoria.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">2. Como Usamos os Dados</h2>
              <p className="text-muted-foreground">
                Os seus dados são utilizados exclusivamente para: prestar o serviço, validar transações, cumprir obrigações legais (KYC/AML), prevenir fraude e melhorar a plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">3. Partilha de Dados</h2>
              <p className="text-muted-foreground">
                <strong>Nunca vendemos os seus dados.</strong> Partilhamos apenas com parceiros estritamente necessários (Deriv, Bybit, gateways de pagamento) ou autoridades competentes mediante ordem legal.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">4. Segurança</h2>
              <p className="text-muted-foreground">
                Aplicamos encriptação em trânsito e em repouso, autenticação segura, Row-Level Security (RLS) na base de dados e auditoria contínua. Apenas o próprio usuário tem acesso aos seus dados.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">5. Cookies e LocalStorage</h2>
              <p className="text-muted-foreground">
                Usamos armazenamento local apenas para sessão e preferências (tema, tour). Ao fazer logout, os dados de sessão são limpos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">6. Os Seus Direitos</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Aceder e corrigir os seus dados a qualquer momento no Perfil;</li>
                <li>Solicitar eliminação da conta via suporte;</li>
                <li>Solicitar uma cópia dos seus dados.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">7. Retenção</h2>
              <p className="text-muted-foreground">
                Mantemos os dados enquanto a sua conta estiver ativa e por períodos legalmente exigidos após encerramento (mínimo 5 anos para registos financeiros).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">8. Contacto do Encarregado de Dados</h2>
              <p className="text-muted-foreground">
                Email: <strong className="text-primary">imchleonor@gmail.com</strong><br />
                Telefone: <strong className="text-primary">943 723 434</strong>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
