import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useKycStatus } from './useKycStatus';

/**
 * Controls the first-login onboarding flow:
 * 1. Forces KYC verification popup (BI angolano + selfie)
 * 2. Then runs an interactive tour of the app
 *
 * Flags are scoped per-user via localStorage so each new sign-up gets the flow.
 */
export function useOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const { isVerified, loading: kycLoading, hasSubmitted } = useKycStatus();

  const [showKycModal, setShowKycModal] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const tourKey = user?.id ? `imch_tour_done_${user.id}` : null;
  const kycPromptKey = user?.id ? `imch_kyc_prompted_${user.id}` : null;

  useEffect(() => {
    if (authLoading || kycLoading || !user?.id || !tourKey || !kycPromptKey) return;

    const tourDone = localStorage.getItem(tourKey) === '1';
    const kycPromptedThisSession = sessionStorage.getItem(kycPromptKey) === '1';

    // Step 1: KYC mandatory popup — show until user is verified.
    // Show once per session if not verified (avoid spamming on each route change).
    if (!isVerified && !kycPromptedThisSession) {
      setShowKycModal(true);
      sessionStorage.setItem(kycPromptKey, '1');
      return;
    }

    // Step 2: After KYC verified, run the tour once.
    if (isVerified && !tourDone) {
      setShowTour(true);
    }
  }, [authLoading, kycLoading, user?.id, isVerified, hasSubmitted, tourKey, kycPromptKey]);

  const closeKycModal = () => setShowKycModal(false);

  const finishTour = () => {
    if (tourKey) localStorage.setItem(tourKey, '1');
    setShowTour(false);
  };

  return {
    showKycModal,
    showTour,
    closeKycModal,
    finishTour,
    isVerified,
  };
}
