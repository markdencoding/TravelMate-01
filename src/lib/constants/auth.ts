export const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes of inactivity before warning
export const COUNTDOWN_SECONDS = 60; // 60-second grace countdown before automatic sign-out
export const TOTAL_EXPIRY_MS = IDLE_TIMEOUT_MS + COUNTDOWN_SECONDS * 1000; // 6 minutes total session timeout
export const INACTIVITY_COOKIE_NAME = 'travelmate_last_active';
