import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { useUserRepositories } from "#/hooks/query/use-user-repositories";
import { GitRepository } from "#/types/git";
import { useWizeTeamsSession } from "#/hooks/use-wize-teams-session";
import { TaskList } from "#/components/features/wize-teams/task-list";
import ConversationDisplay from "#/components/features/wize-teams/conversation-display";
import { RunStatus, TaskStatus } from "#/api/wize-teams.types";
import { WIZE_TEAMS_CONFIG } from "#/config/teams-config";

function SpecificationBuilderScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { query, selectedRepositoryId } = location.state || {};
  const [userInput, setUserInput] = useState("");
  const [selectedRepository, setSelectedRepository] = useState<GitRepository | null>(null);

  const {
    mutate: createConversation,
    isPending,
    isSuccess,
  } = useCreateConversation();

  const { data: repositories } = useUserRepositories();

  // Find the selected repository
  useEffect(() => {
    if (repositories && selectedRepositoryId) {
      const repo = repositories.find((r: GitRepository) => r.id.toString() === selectedRepositoryId);
      if (repo) {
        setSelectedRepository(repo);
      }
    }
  }, [repositories, selectedRepositoryId]);

  // Wize Teams integration
  const {
    startSession,
    continueSession,
    continueSessionAfterUserReply,
    sessionId,
    tasks,
    messages,
    sessionResult,
    pendingInquiry,
    isLoading: isLoadingWizeTeams,
    isCompleted,
    isAwaitingUserInput,
    error: wizeTeamsError
  } = useWizeTeamsSession({ teamId: WIZE_TEAMS_CONFIG.DEFAULT_TEAM_ID });

  // Start the session when the component mounts if we have a query
  // Use ref to track if the session has already been started
  const sessionStartedRef = useRef(false);

  useEffect(() => {
    // Check that we have a query, no active session, and the session hasn't been started yet
    if (query && !sessionId && !sessionStartedRef.current && !isLoadingWizeTeams) {
      // Set the flag that the session has been started
      sessionStartedRef.current = true;
      // Start the session
      startSession(query);
    }
  }, [query, sessionId, startSession, isLoadingWizeTeams]);

  // Handle user input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && !isLoadingWizeTeams) {
      if (pendingInquiry) {
        // If there's a pending inquiry, respond to it
        continueSessionAfterUserReply(pendingInquiry.id, userInput);
      } else if (sessionId) {
        // If there's an active session, continue it
        continueSession(sessionId, userInput);
      }
      setUserInput("");
    }
  };

  // Handle sending the specification to the coder
  const handleSendToCoder = () => {
    if (!isCompleted || !sessionId) return;

    console.log('Send to coder button clicked');
    console.log('Session completed:', isCompleted);
    console.log('Selected repository:', selectedRepository);
    console.log('Session result:', sessionResult);

    // First try to get specification from sessionResult if available
    if (sessionResult && sessionResult.result) {
      console.log('Using session result for specification');

      // Format the specification based on the result structure
      let specification = '';
      let formattedSpecification = '';

      if (typeof sessionResult.result === 'object') {
        // If it's an object with required_information or other structured data
        specification = JSON.stringify(sessionResult.result, null, 2);

        // Create a more readable formatted version for display
        formattedSpecification = Object.entries(sessionResult.result)
          .map(([key, value]) => {
            const formattedKey = key.replace(/_/g, ' ').toUpperCase();
            if (Array.isArray(value)) {
              const listItems = value.map(item => `  - ${item}`).join('\n');
              return `${formattedKey}:\n${listItems}`;
            }
            return `${formattedKey}: ${value}`;
          })
          .join('\n\n');
      } else {
        // If it's a string or other primitive
        specification = String(sessionResult.result);
        formattedSpecification = specification;
      }

      // Save the formatted specification to localStorage to display it in the new conversation
      localStorage.setItem('pendingSpecification', formattedSpecification);

      // Create a conversation with the specification
      createConversation({
        q: `Generated specification:\n\n${specification}`,
        selectedRepository: selectedRepository // Pass the repository object, not just the ID
      });

      // Navigate back to home after creating the conversation
      return;
    }

    // Fallback to using the last message if no session result is available
    const finalMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    if (finalMessage) {
      console.log('Final message found:', finalMessage);
      const specification = finalMessage.message || finalMessage.content || "";

      // Format the specification to be more readable
      let formattedSpecification = specification;

      // Try to parse JSON if it looks like JSON
      if (specification.trim().startsWith('{') && specification.trim().endsWith('}')) {
        try {
          const parsedSpec = JSON.parse(specification);
          if (typeof parsedSpec === 'object') {
            formattedSpecification = Object.entries(parsedSpec)
              .map(([key, value]) => {
                const formattedKey = key.replace(/_/g, ' ').toUpperCase();
                if (Array.isArray(value)) {
                  const listItems = value.map(item => `  - ${item}`).join('\n');
                  return `${formattedKey}:\n${listItems}`;
                }
                return `${formattedKey}: ${value}`;
              })
              .join('\n\n');
          }
        } catch (e) {
          // If parsing fails, use the original specification
          console.log('Failed to parse specification as JSON:', e);
        }
      }

      // Save the formatted specification to localStorage to display it in the new conversation
      localStorage.setItem('pendingSpecification', formattedSpecification);

      // Create a conversation with the specification
      createConversation({
        q: `Generated specification:\n\n${specification}`,
        selectedRepository: selectedRepository // Pass the repository object, not just the ID
      });

      // Navigate back to home after creating the conversation
    } else {
      console.error('No specification found in session result or messages');
    }
  };

  // Check if user can send a message (only when not loading and either no session or session needs user input)
  const canSendMessage = !isLoadingWizeTeams && (!sessionId || isAwaitingUserInput);

  return (
    <div className="bg-base-secondary h-full flex flex-col px-[10px] pt-[10px] gap-4 overflow-hidden">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-neutral-700 transition-colors"
            title="Back to home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-2xl font-semibold">Specification Builder</h1>
        </div>
        <div className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
          isCompleted ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'
        }`}>
          {!isCompleted && (
            <span className="animate-pulse h-2 w-2 bg-green-300 rounded-full"></span>
          )}
          {isCompleted ? 'Completed' : 'In Progress'}
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Left side - Chat */}
        <div className="flex-1 bg-base-primary border border-neutral-700 p-4 flex flex-col">
          <h3 className="text-md font-medium mb-2">Conversation</h3>
          <div className="flex-1 overflow-y-auto mb-4">
            <ConversationDisplay
              messages={messages}
              isLoading={isLoadingWizeTeams}
              sessionResult={sessionResult}
              isCompleted={isCompleted}
              onSendToCoder={isCompleted ? handleSendToCoder : undefined}
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 bg-base-secondary border border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isLoadingWizeTeams}
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isLoadingWizeTeams || !canSendMessage}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            {!canSendMessage && sessionId && !isAwaitingUserInput && !isCompleted && (
              <div className="text-xs text-neutral-400 mt-1 text-center">
                Waiting for AI team to complete current tasks...
              </div>
            )}
          </form>
          {/* Send to Coder button moved to ConversationDisplay component */}
        </div>

        {/* Right side - Tasks and Results */}
        <div className="w-1/3 bg-base-primary border border-neutral-700 p-4 flex flex-col">
          <h3 className="text-md font-medium mb-2">Tasks</h3>
          <div className="flex-1 overflow-y-auto">
            <TaskList
              tasks={tasks}
              isLoading={isLoadingWizeTeams}
            />

            {/* Session Results are now displayed in the chat as a message */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpecificationBuilderScreen;
