import { describe, expect, it } from 'vitest';

import { accessCodeStatusFromPayload, OPEN_ACCESS_STATUS } from '@/lib/access-code-status';

describe('accessCodeStatusFromPayload', () => {
  it('fails open unless the JSON body explicitly has enabled: true', () => {
    expect(accessCodeStatusFromPayload(undefined)).toEqual(OPEN_ACCESS_STATUS);
    expect(accessCodeStatusFromPayload(null)).toEqual(OPEN_ACCESS_STATUS);
    expect(accessCodeStatusFromPayload('not-json')).toEqual(OPEN_ACCESS_STATUS);
    expect(accessCodeStatusFromPayload({})).toEqual(OPEN_ACCESS_STATUS);
    expect(accessCodeStatusFromPayload({ enabled: false })).toEqual(OPEN_ACCESS_STATUS);
    expect(accessCodeStatusFromPayload({ enabled: 'true' })).toEqual(OPEN_ACCESS_STATUS);
    expect(accessCodeStatusFromPayload({ success: true })).toEqual(OPEN_ACCESS_STATUS);
  });

  it('locks the gate only for an explicit enabled: true payload', () => {
    expect(accessCodeStatusFromPayload({ enabled: true })).toEqual({
      enabled: true,
      authenticated: false,
    });
    expect(accessCodeStatusFromPayload({ enabled: true, authenticated: true })).toEqual({
      enabled: true,
      authenticated: true,
    });
    expect(accessCodeStatusFromPayload({ enabled: true, authenticated: 'yes' })).toEqual({
      enabled: true,
      authenticated: false,
    });
  });
});
