import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate } from 'react-router-dom';

interface AppTourProps {
  active: boolean;
  onFinish: () => void;
}

export function AppTour({ active, onFinish }: AppTourProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!active) return;

    // Make sure we're on home before starting
    navigate('/');

    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      nextBtnText: 'Próximo →',
      prevBtnText: '← Voltar',
      doneBtnText: 'Concluir ✓',
      showButtons: ['next', 'previous', 'close'],
      progressText: '{{current}} de {{total}}',
      popoverClass: 'imch-tour-popover',
      onDestroyed: () => onFinish(),
      steps: [
        {
          element: '[data-tour="profile-header"]',
          popover: {
            title: '👋 Bem-vindo à IMCHLEONOR',
            description: 'Aqui está o seu perfil. Clique para editar dados pessoais, avatar e ver o seu badge de verificação.',
          },
        },
        {
          element: '[data-tour="exchange-avatars"]',
          popover: {
            title: '🔗 Conecte suas Corretoras',
            description: 'Adicione fotos e links das suas contas Bybit, Deriv, Binance e Redotpay para acesso rápido.',
            side: 'bottom',
          },
        },
        {
          element: '[data-tour="balance-card"]',
          popover: {
            title: '💰 Sua Carteira IMCH',
            description: 'Veja o seu saldo em IMCH Coin e o equivalente em USD. 1 IMCH = 1 USD, sem taxas.',
          },
        },
        {
          element: '[data-tour="crypto-list"]',
          popover: {
            title: '📈 Mercado Cripto',
            description: 'Acompanhe os preços ao vivo das principais criptomoedas atualizados a cada 15 segundos.',
          },
        },
        {
          element: '[data-tour="sidebar-wallet"]',
          popover: {
            title: '🏦 Carteira',
            description: 'Acesse depósitos, saques e veja os endereços das suas wallets internas.',
            side: 'right',
          },
        },
        {
          element: '[data-tour="sidebar-send"]',
          popover: {
            title: '📤 Enviar Fundos',
            description: 'Transfira IMCH para outros usuários ou para suas contas Deriv, Bybit, Binance e Redotpay.',
            side: 'right',
          },
        },
        {
          element: '[data-tour="sidebar-history"]',
          popover: {
            title: '🕐 Histórico',
            description: 'Consulte todas as suas transações, depósitos, saques e transferências em um só lugar.',
            side: 'right',
          },
        },
        {
          element: '[data-tour="sidebar-settings"]',
          popover: {
            title: '⚙️ Configurações',
            description: 'Personalize tema, idioma e gerencie a segurança da sua conta.',
            side: 'right',
          },
        },
        {
          popover: {
            title: '🎉 Tudo pronto!',
            description: 'Você está pronto para usar a IMCHLEONOR. Boas trocas!',
          },
        },
      ],
    });

    // Slight delay so the DOM is mounted before highlighting
    const t = setTimeout(() => driverObj.drive(), 300);

    return () => {
      clearTimeout(t);
      driverObj.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return null;
}
