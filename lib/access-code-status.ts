export type AccessCodeGateStatus = {
  enabled: boolean;
  authenticated: boolean;
};

/** Open access — the gate must never lock the UI when status is unknown. */
export const OPEN_ACCESS_STATUS: AccessCodeGateStatus = {
  enabled: false,
  authenticated: false,
};

/**
 * Only lock the UI when the status payload explicitly says the gate is on.
 * Network failures, HTML 404 bodies, and unexpected JSON all fail open.
 */
export function accessCodeStatusFromPayload(data: unknown): AccessCodeGateStatus {
  if (!data || typeof data !== 'object') {
    return OPEN_ACCESS_STATUS;
  }
  const record = data as { enabled?: unknown; authenticated?: unknown };
  if (record.enabled !== true) {
    return OPEN_ACCESS_STATUS;
  }
  return {
    enabled: true,
    authenticated: record.authenticated === true,
  };
}
