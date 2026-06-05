import { describe, expect, it } from 'vitest';
import { isProfileComplete } from '../services/authService.js';

describe('isProfileComplete', () => {
  it('returns true when both names are set', () => {
    expect(
      isProfileComplete({ first_name: 'Jimmy', last_name: 'Andersson' }),
    ).toBe(true);
  });

  it('returns false when a name is missing or blank', () => {
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete({ first_name: 'Jimmy' })).toBe(false);
    expect(isProfileComplete({ first_name: 'Jimmy', last_name: '' })).toBe(false);
    expect(isProfileComplete({ first_name: '  ', last_name: 'Namn' })).toBe(false);
  });
});
