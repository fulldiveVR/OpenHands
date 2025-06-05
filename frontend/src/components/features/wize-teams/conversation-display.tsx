import React, { useEffect, useRef, useState } from 'react';
import { IMessageRecord } from '../../../api/wize-teams.types';
import Markdown from "react-markdown";
import { code } from "../markdown/code";
import { ul, ol } from "../markdown/list";
import { anchor } from "../markdown/anchor";
import { paragraph } from "../markdown/paragraph";

// Component for displaying collapsible content (used for both task results and final message)
interface CollapsibleContentProps {
  content: any;
  title: string;
  timestamp?: Date | string;
  className?: string;
}

const CollapsibleContent: React.FC<CollapsibleContentProps> = ({ content, title, timestamp, className = "bg-green-900 bg-opacity-20" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldShowExpand, setShouldShowExpand] = useState(false);
  const maxCollapsedLines = 5;
  const lineHeight = 20; // Approximate line height in pixels

  useEffect(() => {
    // Check if content height exceeds the collapsed height
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const collapsedHeight = maxCollapsedLines * lineHeight;
      setShouldShowExpand(contentHeight > collapsedHeight);
    }
  }, [content]);

  // Format the result for display
  const formatContent = () => {
    if (!content) return null;
    
    if (typeof content === 'object') {
      return (
        <div>
          {Object.entries(content).map(([key, value]) => (
            <div key={key} className="mb-2">
              <div className="font-semibold">{key.replace(/_/g, ' ').toUpperCase()}:</div>
              {Array.isArray(value) ? (
                <ul className="list-disc pl-5">
                  {value.map((item, index) => (
                    <li key={index}>
                      <Markdown
                        components={{
                          code,
                          ul,
                          ol,
                          a: anchor,
                          p: paragraph,
                        }}
                      >
                        {String(item)}
                      </Markdown>
                    </li>
                  ))}
                </ul>
              ) : (
                <div>
                  <Markdown
                    components={{
                      code,
                      ul,
                      ol,
                      a: anchor,
                      p: paragraph,
                    }}
                  >
                    {String(value)}
                  </Markdown>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <Markdown
          components={{
            code,
            ul,
            ol,
            a: anchor,
            p: paragraph,
          }}
        >
          {typeof content === 'string' 
            ? content 
            : String(content)}
        </Markdown>
      );
    }
  };

  return (
    <div className={`flex flex-col p-3 rounded-md ${className}`}>
      <div className="flex justify-between text-xs text-neutral-400 mb-1">
        <span>{title}</span>
        {timestamp && (
          <span className="text-xs opacity-70">
            {typeof timestamp === 'string' 
              ? timestamp 
              : new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      
      <div 
        ref={contentRef}
        className={`text-sm overflow-hidden transition-all duration-300 ${!isExpanded && shouldShowExpand ? `max-h-[${maxCollapsedLines * lineHeight}px]` : ''}`}
        style={!isExpanded && shouldShowExpand ? { maxHeight: `${maxCollapsedLines * lineHeight}px` } : {}}
      >
        {formatContent()}
      </div>
      
      {shouldShowExpand && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="text-xs text-blue-400 hover:text-blue-300 mt-2 self-end"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

// Component for displaying task results with collapsible content
interface TaskResultMessageProps {
  message: IMessageRecord;
  title: string;
}

const TaskResultMessage: React.FC<TaskResultMessageProps> = ({ message, title }) => {
  return (
    <CollapsibleContent
      content={message.content}
      title={title}
      timestamp={message.created}
      className="bg-green-900 bg-opacity-20"
    />
  );
};

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
      {displayMessages.map((message, index) => {
        // Special handling for task result messages
        if (message.type === 'task-result') {
          // Extract task title from the message
          const titleMatch = message.message.match(/^Task completed: (.+?)\n/); 
          const title = titleMatch ? `Task completed: ${titleMatch[1]}` : 'Task completed';
          
          return (
            <TaskResultMessage 
              key={message.id || index}
              message={message}
              title={title}
            />
          );
        }
        
        // Regular message display
        return (
          <div
            key={message.id || index}
            className={`flex flex-col p-3 rounded-md ${
              message.sender === 'user'
                ? 'bg-blue-900 bg-opacity-20 ml-auto'
                : message.type === 'notification'
                  ? 'bg-blue-900 bg-opacity-10'
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
                  : message.sender === 'system'
                    ? 'System'
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
            <div className="text-sm">
              <Markdown
                components={{
                  code,
                  ul,
                  ol,
                  a: anchor,
                  p: paragraph,
                }}
              >
                {message.message || message.content}
              </Markdown>
            </div>
          </div>
        );
      })}

      {/* Display session results as a separate message if available */}
      {hasSessionResult && (
        <CollapsibleContent
          content={sessionResult.result || sessionResult}
          title="Final Results"
          timestamp={sessionResult.completedAt ? new Date(sessionResult.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          className="bg-green-900 bg-opacity-30 max-w-3/4"
        />
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
