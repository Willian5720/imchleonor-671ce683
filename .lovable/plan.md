## Objetivo

Expandir o módulo Bot Trader Bybit existente com painel financeiro avançado, gráficos, gestão de risco, análise técnica e integração completa — sem alterar a estrutura principal da app.

## Escopo da entrega (em fases — confirme antes de começar)

Como o pedido é muito extenso, proponho dividir em **4 fases incrementais**. Cada fase é entregue funcional e testável antes da próxima.

---

### Fase 1 — Backend Bybit completo + Painel financeiro real
**Edge Function `bybit-bot` expandida** com ações:
- `dashboard` — retorna saldo total, disponível, bloqueado, PnL não-realizado, posições abertas, status API, última sync
- `history` — ordens fechadas com filtro de período, cálculo de lucro/perda, duração
- `stats` — trades totais, taxa de acerto, ROI, lucro médio, maior lucro/perda, melhor/pior ativo
- `positions` — posições ativas em tempo real (entry, mark price, PnL %, SL, TP)

**Frontend `TradingBot.tsx`** reescrito com:
- Header com 13 métricas financeiras (saldo total, disponível, bloqueado, capital investido, lucros diário/semanal/mensal/total, PnL, ROI, status API/Bot, última sync)
- Polling 15s + animação de transição de valores
- Cards de desempenho modernos com hover

### Fase 2 — Gráficos + Operações Ativas + Histórico
- Gráficos Recharts: Evolução do Patrimônio, Lucros, Comparação BTC/ETH com filtros (24h/7d/30d/90d/1a/Tudo)
- Tabela de Operações Ativas em tempo real (polling 5s)
- Histórico de Investimentos com filtros, busca por ativo e exportação

### Fase 3 — Motor automático + Análise técnica + Gestão de Risco
- Indicadores no backend: RSI, MACD, EMA, SMA, Bollinger, ATR, ADX
- Motor que combina múltiplos indicadores e valida filtros antes de executar
- Tabela `bot_settings` (DB) com: valor máx/op, % máx, SL, TP, limites diário/semanal, ativos habilitados, timeframes
- Tela de Configurações do Bot
- Bloqueio automático ao atingir limites + log

### Fase 4 — Logs inteligentes + Notificações + Segurança
- Tabela `bot_logs` com tipo (mercado/compra/SL/TP/erro), emoji, detalhes JSON
- Centro de notificações in-app via toast + tabela `bot_notifications`
- Auditoria, reconexão automática, proteção anti-duplicação

---

## Considerações técnicas importantes

1. **WebSocket Bybit**: Edge Functions Lovable Cloud **não suportam WebSocket persistente** (memória de projeto). Vou usar **polling otimizado** (5–15s) que dá a mesma sensação de tempo real sem custo extra. Se quiser WebSocket verdadeiro, precisaria de um worker externo (Railway/Fly.io).
2. **API Bybit**: tudo via `ccxt` já instalado — saldo, posições, ordens, OHLCV, market info são reais da sua conta.
3. **Criptografia das chaves**: as chaves já estão em Secrets (BYBIT_API_KEY/BYBIT_SECRET_KEY) — Lovable Cloud já as armazena criptografadas. Nada exposto ao frontend.
4. **Execução real de ordens**: hoje o código está em modo SIMULAÇÃO (linha comentada). Devo ativar execução real na Fase 3? **Risco financeiro real.**

## Pergunta antes de começar

**Você confirma começar pela Fase 1?** E quer execução real de ordens (não simulação) na Fase 3?
