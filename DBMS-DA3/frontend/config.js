/**
 * SwiftShip Courier Operations - Runtime Configuration
 *
 * For local development:
 *   Leave apiBase as '' (defaults automatically to 'http://localhost:8082').
 *
 * For Koyeb + Netlify production:
 *   Set apiBase to your deployed Koyeb backend public HTTPS URL.
 *   Example:
 *     apiBase: 'https://swiftship-backend-<your-org>.koyeb.app'
 */
window.SWIFTSHIP_CONFIG = {
  // Deployed Koyeb backend URL (leave empty for local development):
  apiBase: ''
};
