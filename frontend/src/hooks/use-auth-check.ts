import { useEffect, useState } from "react";

/**
 * Check if refresh token exists in cookies
 */
const hasRefreshToken = (): boolean => {
  // Check for refresh token in cookies
  const cookies = document.cookie.split(';');
  return cookies.some(cookie => cookie.trim().startsWith('rf='));
};

/**
 * Hook to check if user is authenticated by verifying refresh token in cookies
 * Shows non-closable alert on localhost or redirects to auth URL on other environments
 */
export const useAuthCheck = () => {
  const [showAlert, setShowAlert] = useState(false);
  useEffect(() => {
    const checkAuth = () => {
      // Check if refresh token exists in cookies
      const refreshTokenExists = hasRefreshToken();

      if (!refreshTokenExists) {
        // Check if we're on localhost
        const isLocalhost = window.location.hostname === "localhost" ||
                           window.location.hostname === "127.0.0.1";

        if (isLocalhost) {
          // Show non-closable alert for localhost
          setShowAlert(true);
        } else {
          // Redirect to auth URL for non-localhost
          const authUrl = import.meta.env.VITE_AUTH_URL;

          if (authUrl) {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `${authUrl}${currentUrl}`;
          }
        }
      }
    };

    checkAuth();
  }, []);

  return { showAlert };
};
