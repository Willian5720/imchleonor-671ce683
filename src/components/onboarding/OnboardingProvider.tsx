import { useOnboarding } from '@/hooks/useOnboarding';
import { KycRequiredModal } from './KycRequiredModal';
import { AppTour } from './AppTour';

export function OnboardingProvider() {
  const { showKycModal, showTour, closeKycModal, finishTour } = useOnboarding();

  return (
    <>
      <KycRequiredModal open={showKycModal} onClose={closeKycModal} />
      <AppTour active={showTour} onFinish={finishTour} />
    </>
  );
}
