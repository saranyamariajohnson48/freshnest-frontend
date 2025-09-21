// Utilities for product expiry calculations
// Usage: getExpiryStatus(expiryDate)
// Returns: { expired, expiringSoon, within30, daysLeft }

export function getExpiryStatus(expiryDate) {
  if (!expiryDate) {
    return { expired: false, expiringSoon: false, within30: false, daysLeft: null };
  }
  const now = new Date();
  const exp = new Date(expiryDate);
  if (isNaN(exp.getTime())) {
    return { expired: false, expiringSoon: false, within30: false, daysLeft: null };
  }

  const diffMs = exp.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  const expired = exp < now;
  const expiringSoon = !expired && daysLeft <= 5; // critical window
  const within30 = !expired && !expiringSoon && exp < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return { expired, expiringSoon, within30, daysLeft };
}