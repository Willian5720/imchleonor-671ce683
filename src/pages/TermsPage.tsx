import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Termos de Uso</h1>
            <p className="text-sm text-muted-foreground">Última atualização: Abril de 2026</p>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-card/80 to-card border-border/50">
          <CardContent className="p-6 space-y-6 text-sm text-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-primary mb-2">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao criar uma conta na plataforma <strong>IMCHLEONOR Exchange</strong>, você concorda integralmente com estes Termos de Uso. Caso não concorde, deve cessar imediatamente o uso da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground">
                A IMCHLEONOR é uma plataforma de troca de criptomoedas que opera com a moeda nativa <strong>IMCH Coin</strong> (1 IMCH = 1 USD). Permitimos depósitos em Kwanza (AOA), conversões, transferências internas e externas, e integração com corretoras parceiras (Deriv, Bybit, Binance, Redotpay).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">3. Verificação de Identidade (KYC)</h2>
              <p className="text-muted-foreground">
                Para realizar transferências, o usuário deve completar a verificação de identidade enviando documento oficial e selfie. Recusamos contas com documentos falsos ou inválidos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">4. Taxas e Câmbio</h2>
              <p className="text-muted-foreground">
                A plataforma opera com <strong>zero taxas</strong> em conversões internas. A taxa fixa é de <strong>1000 AOA = 1 IMCH</strong>. Saques em criptomoedas externas (ERC20) podem estar sujeitos a taxas de rede blockchain.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">5. Responsabilidades do Usuário</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Manter as suas credenciais de acesso seguras;</li>
                <li>Fornecer dados verdadeiros e atualizados;</li>
                <li>Não utilizar a plataforma para atividades ilícitas;</li>
                <li>Verificar endereços de carteira antes de qualquer envio.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">6. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground">
                A IMCHLEONOR não se responsabiliza por perdas decorrentes de erro do usuário, falhas em redes blockchain externas, ou flutuações de mercado. Transações em blockchain são <strong>irreversíveis</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">7. Suspensão de Conta</h2>
              <p className="text-muted-foreground">
                Reservamo-nos o direito de suspender contas que violem estes termos, apresentem atividades suspeitas ou estejam envolvidas em fraude.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">8. Alterações</h2>
              <p className="text-muted-foreground">
                Podemos atualizar estes termos a qualquer momento. Alterações relevantes serão notificadas via email ou na plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary mb-2">9. Contacto</h2>
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
