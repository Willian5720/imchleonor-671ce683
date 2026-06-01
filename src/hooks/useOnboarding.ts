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

    // Once verified: ensure the modal is closed and never re-prompt this session.
    // Verified users are NOT new users — skip the tour entirely and mark it done.
    if (isVerified) {
      if (showKycModal) setShowKycModal(false);
      sessionStorage.setItem(kycPromptKey, '1');
      if (!tourDone) localStorage.setItem(tourKey, '1');
      return;
    }

    // Step 1: KYC mandatory popup — show until user is verified.
    // Show once per session if not verified (avoid spamming on each route change).
    if (!isVerified && !kycPromptedThisSession) {
      setShowKycModal(true);
      sessionStorage.setItem(kycPromptKey, '1');
      return;
    }
  }, [authLoading, kycLoading, user?.id, isVerified, hasSubmitted, tourKey, kycPromptKey, showKycModal]);

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
