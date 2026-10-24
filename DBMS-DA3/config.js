/**
 * SwiftShip Courier Operations - Runtime Configuration
 *
 * For Netlify production (Full-Stack serverless functions):
 *   Leave apiBase as '' (same-origin relative URL, routed to Netlify Functions).
 *
 * For local standalone Java development (if running Spring Boot backend without Netlify CLI):
 *   Set apiBase to 'http://localhost:8082'.
 */
window.SWIFTSHIP_CONFIG = {
  // Default: same-origin Netlify Functions:
  apiBase: ''
};
