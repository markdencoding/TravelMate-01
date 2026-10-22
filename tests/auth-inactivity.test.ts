import { describe, it, expect } from 'vitest';
import {
  IDLE_TIMEOUT_MS,
  COUNTDOWN_SECONDS,
  TOTAL_EXPIRY_MS,
  INACTIVITY_COOKIE_NAME,
} from '@/lib/constants/auth';

describe('Auth Inactivity & Auto-Logout Engine', () => {
  it('defines correct timeout constants matching security specifications', () => {
    expect(IDLE_TIMEOUT_MS).toBe(5 * 60 * 1000); // 5 minutes
    expect(COUNTDOWN_SECONDS).toBe(60); // 60 seconds grace countdown
    expect(TOTAL_EXPIRY_MS).toBe(6 * 60 * 1000); // 6 minutes total
    expect(INACTIVITY_COOKIE_NAME).toBe('travelmate_last_active');
  });

  describe('Session status evaluator logic', () => {
    function evaluateSession(lastActiveTime: number, currentTime: number) {
      const elapsed = currentTime - lastActiveTime;
      if (elapsed >= TOTAL_EXPIRY_MS) {
        return { status: 'EXPIRED', showWarning: false, remainingSeconds: 0 };
      }
      if (elapsed >= IDLE_TIMEOUT_MS) {
        const remainingMs = TOTAL_EXPIRY_MS - elapsed;
        const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
        return { status: 'WARNING', showWarning: true, remainingSeconds };
      }
      return { status: 'ACTIVE', showWarning: false, remainingSeconds: COUNTDOWN_SECONDS };
    }

    it('identifies an active user within the 5-minute inactivity window', () => {
      const lastActive = 1000000;
      const current = lastActive + 3 * 60 * 1000; // 3 minutes later
      const result = evaluateSession(lastActive, current);

      expect(result.status).toBe('ACTIVE');
      expect(result.showWarning).toBe(false);
    });

    it('triggers warning countdown at exactly 5 minutes of inactivity', () => {
      const lastActive = 1000000;
      const current = lastActive + IDLE_TIMEOUT_MS; // Exactly 5 minutes
      const result = evaluateSession(lastActive, current);

      expect(result.status).toBe('WARNING');
      expect(result.showWarning).toBe(true);
      expect(result.remainingSeconds).toBe(60);
    });

    it('correctly calculates remaining countdown seconds mid-warning (e.g. 30 seconds left)', () => {
      const lastActive = 1000000;
      const current = lastActive + IDLE_TIMEOUT_MS + 30 * 1000; // 5 min 30 sec
      const result = evaluateSession(lastActive, current);

      expect(result.status).toBe('WARNING');
      expect(result.showWarning).toBe(true);
      expect(result.remainingSeconds).toBe(30);
    });

    it('expires session when elapsed time reaches 6 minutes (5m idle + 60s countdown)', () => {
      const lastActive = 1000000;
      const current = lastActive + TOTAL_EXPIRY_MS; // Exactly 6 minutes
      const result = evaluateSession(lastActive, current);

      expect(result.status).toBe('EXPIRED');
      expect(result.showWarning).toBe(false);
      expect(result.remainingSeconds).toBe(0);
    });

    it('correctly handles closed browser scenario: user returns after 15 minutes away', () => {
      const userClosedBrowserAt = 1000000;
      const userReopenedBrowserAt = userClosedBrowserAt + 15 * 60 * 1000; // 15 minutes later
      const result = evaluateSession(userClosedBrowserAt, userReopenedBrowserAt);

      expect(result.status).toBe('EXPIRED');
      expect(result.remainingSeconds).toBe(0);
    });

    it('correctly handles closed browser scenario: user returns after 2 minutes away', () => {
      const userClosedBrowserAt = 1000000;
      const userReopenedBrowserAt = userClosedBrowserAt + 2 * 60 * 1000; // 2 minutes later
      const result = evaluateSession(userClosedBrowserAt, userReopenedBrowserAt);

      expect(result.status).toBe('ACTIVE');
      expect(result.showWarning).toBe(false);
    });
  });
});
