import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultDropoffDate, defaultPickupDate, localIsoDate, todayIsoDate } from '../utils/dates';

afterEach(() => vi.useRealTimers());

describe('search dates', () => {
  it('starts tomorrow and returns three days later', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 19, 15, 0));
    expect(todayIsoDate()).toBe('2026-11-19');
    expect(defaultPickupDate()).toBe('2026-11-20');
    expect(defaultDropoffDate()).toBe('2026-11-23');
  });

  it('uses the visitor\'s own calendar just before midnight and across months', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 11, 31, 23, 50));
    expect(defaultPickupDate()).toBe('2027-01-01');
    expect(localIsoDate(new Date(2026, 1, 3))).toBe('2026-02-03');
  });
});
