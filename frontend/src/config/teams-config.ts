// Configuration for Wize Teams integration
export const WIZE_TEAMS_CONFIG = {
  // Default team ID for specification builder
  DEFAULT_TEAM_ID: import.meta.env.VITE_TEAMS_DEFAULT_TEAM_ID,

  // Polling interval in milliseconds
  POLLING_INTERVAL: 5000,

  // API base URL
  API_BASE_URL: import.meta.env.VITE_TEAMS_API_BASE_URL || "https://wize-teams-api.aiwayz.com"
};

export default WIZE_TEAMS_CONFIG;
