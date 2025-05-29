// Configuration for Wize Teams integration
export const WIZE_TEAMS_CONFIG = {
  // Default team ID for specification builder
  DEFAULT_TEAM_ID: "6kmLWCZ7d04y2OgolOdXB", // n5zC5Cj3qdbm9YmAnkt6T

  // Polling interval in milliseconds
  POLLING_INTERVAL: 5000,

  // API base URL
  API_BASE_URL: import.meta.env.VITE_TEAMS_API_BASE_URL || "https://wize-teams-api.aiwayz.com"
};

export default WIZE_TEAMS_CONFIG;
