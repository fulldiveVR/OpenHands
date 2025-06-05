import React from "react";

/**
 * Non-closable modal component that displays a fixed modal in the center of the screen
 * This modal cannot be dismissed by the user and uses the app's theme colors
 */
export const NonClosableAlert: React.FC = () => {
  return (
    <>
      {/* Modal backdrop with blur effect */}
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40" />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-base-secondary rounded-lg shadow-xl max-w-md w-full p-[40px]">
          <div className="flex flex-col items-center text-center">
            {/* Info icon */}
            <div className="rounded-full bg-tertiary p-4 mb-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-10 w-10 text-primary" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            
            {/* Title */}
            <h3 className="text-xl font-bold text-content mb-3">
              Authentication Required
            </h3>
            
            {/* Message */}
            <p className="text-content-2 mb-8">
              rf Authentication token is missing. Please sign in again.
            </p>
            
            {/* Non-functional button to emphasize that action is needed */}
            <button 
              className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-content font-medium rounded-[5px] shadow-sm"
              onClick={(e) => e.preventDefault()} // Prevent any action
            >
              Sign In Required
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
