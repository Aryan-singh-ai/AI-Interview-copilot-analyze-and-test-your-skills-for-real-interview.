// In-memory store for OTPs (for MVP purposes)
// Format: { "email": { code: "1234", expiresAt: 123456789 } }
export const otpStore = new Map<string, { code: string; expiresAt: number }>();
