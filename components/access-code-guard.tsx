'use client';

import { useEffect, useState, ReactNode } from 'react';
import { AccessCodeModal } from '@/components/access-code-modal';
import { accessCodeStatusFromPayload, OPEN_ACCESS_STATUS } from '@/lib/access-code-status';
import { useSettingsStore } from '@/lib/store/settings';

export function AccessCodeGuard({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<{
    enabled: boolean;
    authenticated: boolean;
    loading: boolean;
  }>({ ...OPEN_ACCESS_STATUS, loading: true });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/access-code/status')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`access-code status HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setStatus({
            ...accessCodeStatusFromPayload(data),
            loading: false,
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          // Status API failed (network, 404 HTML, non-JSON). Fail open so a
          // broken compile/runtime cannot permanently lock the local UI.
          console.warn('[access-code] status check failed; defaulting to open access', error);
          setStatus({ ...OPEN_ACCESS_STATUS, loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const needsAuth = !status.loading && status.enabled && !status.authenticated;

  return (
    <>
      {needsAuth && (
        <AccessCodeModal
          open={true}
          onSuccess={() => {
            setStatus((s) => ({ ...s, authenticated: true }));
            // ServerProvidersInit runs on mount, which on an ACCESS_CODE-gated
            // deployment is before any access cookie exists: the middleware
            // answers 401 and the store silently keeps its blank defaults.
            // Nothing re-fetches afterwards, so every server-configured
            // provider reads as unconfigured until a manual reload. Re-fetch
            // now that the request will be authorized.
            void useSettingsStore.getState().fetchServerProviders();
          }}
        />
      )}
      {children}
    </>
  );
}
