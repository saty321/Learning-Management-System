// utils/tokenUtils.js
import crypto from 'crypto';

/**
 * Generates a secure random token for authentication
 * @returns {string} A random hex string
 */
const generateToken = () => {
  // Generate a random 32-byte buffer and convert to hex string
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Creates an expiration date for a token
 * @param {number} expiresInHours - Number of hours until token expires
 * @returns {Date} The expiration date
 */
const createExpirationDate = (expiresInHours = 24) => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);
  return expiresAt;
};

/**
 * Checks if a date is expired
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is in the past
 */
const isExpired = (date) => {
  return new Date() > new Date(date);
};

export { generateToken, createExpirationDate, isExpired };