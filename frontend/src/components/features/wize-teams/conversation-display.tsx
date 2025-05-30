import React, { useEffect, useRef } from 'react';
import { IMessageRecord } from '../../../api/wize-teams.types';

interface ConversationDisplayProps {
  messages: IMessageRecord[];
  isLoading: boolean;
  sessionResult?: any;
  isCompleted?: boolean;
  onSendToCoder?: () => void;
}

export const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ messages, isLoading, sessionResult, isCompleted, onSendToCoder }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Check if we have session results to display
  const hasSessionResult = sessionResult && Object.keys(sessionResult || {}).length > 0;
  console.log('ConversationDisplay - hasSessionResult:', hasSessionResult);
  console.log('ConversationDisplay - sessionResult:', sessionResult);

  // If loading and no messages and no results, show loading state
  if (isLoading && messages.length === 0 && !hasSessionResult) {
    return (
      <div className="flex flex-col space-y-4 mt-4">
        <div className="animate-pulse bg-neutral-800 h-12 rounded-md w-3/4"></div>
        <div className="animate-pulse bg-neutral-800 h-12 rounded-md w-1/2 ml-auto"></div>
        <div className="animate-pulse bg-neutral-800 h-12 rounded-md w-3/4"></div>
      </div>
    );
  }

  // If no messages and no session results, show empty state
  if (messages.length === 0 && !hasSessionResult) {
    return (
      <div className="text-center py-4 text-neutral-400">
        No conversation yet
      </div>
    );
  }

  // Function to determine if a message is the final specification
  const isFinalSpecification = (message: IMessageRecord, index: number) => {
    // Only show as final specification if the session is completed and it's the last AI message
    return isCompleted && index === messages.length - 1 && message.sender !== 'user';
  };

  // Create an array of messages to display with duplicates removed
  // Use a function instead of useMemo to avoid React hooks errors
  const deduplicateMessages = (messages: IMessageRecord[]): IMessageRecord[] => {
    // Use a Map to track unique messages by content
    const uniqueMessages = new Map<string, IMessageRecord>();
    
    // Process messages in reverse order (newest first)
    // so we keep the most recent version of any duplicate message
    [...messages].reverse().forEach((message) => {
      // Create a key based on message content and sender
      const key = `${message.sender}-${message.message}`;
      
      // Only add if we haven't seen this message content before
      if (!uniqueMessages.has(key)) {
        uniqueMessages.set(key, message);
      }
    });
    
    // Convert back to array and reverse to original order
    return Array.from(uniqueMessages.values()).reverse();
  };
  
  // Apply deduplication to messages
  const displayMessages = deduplicateMessages(messages);

  // Log for debugging
  console.log('ConversationDisplay - original messages count:', messages.length);
  console.log('ConversationDisplay - deduplicated messages count:', displayMessages.length);
  console.log('ConversationDisplay - isCompleted:', isCompleted);

  return (
    <div className="flex flex-col space-y-4 mt-4">
      {/* Display regular messages */}
      {displayMessages.map((message, index) => (
        <div
          key={message.id || index}
          className={`flex flex-col p-3 rounded-md ${
            message.sender === 'user'
              ? 'bg-blue-900 bg-opacity-20 ml-auto'
              : isFinalSpecification(message, index)
                ? 'bg-green-900 bg-opacity-30'
                : 'bg-neutral-800'
          } ${
            message.sender === 'user' ? 'max-w-3/4 ml-auto' : 'max-w-3/4'
          }`}
        >
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>
              {message.sender === 'user'
                ? 'You'
                : isFinalSpecification(message, index)
                  ? 'Final Specification'
                  : message.agentId || 'AI Team'}
            </span>
            {message.created && (
              <span className="text-xs opacity-70">
                {new Date(message.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="text-sm whitespace-pre-wrap">
            {message.message || message.content}
          </div>
        </div>
      ))}

      {/* Display session results as a separate message if available */}
      {hasSessionResult && (
        <div
          className="flex flex-col p-3 rounded-md bg-green-900 bg-opacity-30 max-w-3/4"
        >
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Results</span>
            <span className="text-xs opacity-70">
              {sessionResult.completedAt ? new Date(sessionResult.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Display results in formatted view */}
          <div className="text-sm whitespace-pre-wrap mb-3">
            {sessionResult.result && typeof sessionResult.result === 'object' ? (
              <div>
                {Object.entries(sessionResult.result).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <div className="font-semibold">{key.replace(/_/g, ' ').toUpperCase()}:</div>
                    {Array.isArray(value) ? (
                      <ul className="list-disc pl-5">
                        {value.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <div>{String(value)}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              JSON.stringify(sessionResult.result || sessionResult, null, 2)
            )}
          </div>
        </div>
      )}

      {/* Send to Coder button as a separate element */}
      {hasSessionResult && onSendToCoder && isCompleted && (
        <div className="mt-2 flex justify-center">
          <button
            onClick={onSendToCoder}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm"
          >
            Send to Coder
          </button>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ConversationDisplay;
