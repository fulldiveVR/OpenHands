import React from "react";
import { PrefetchPageLinks, useNavigate } from "react-router";
import { HomeHeader } from "#/components/features/home/home-header";
import { RepoConnector } from "#/components/features/home/repo-connector";
import { TaskSuggestions } from "#/components/features/home/tasks/task-suggestions";
import { useUserProviders } from "#/hooks/use-user-providers";
import { BrandButton } from "#/components/features/settings/brand-button";
import { useTranslation } from "react-i18next";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { useIsCreatingConversation } from "#/hooks/use-is-creating-conversation";
import { ConversationPanel } from "#/components/features/conversation-panel/conversation-panel";
import { useUserConversations } from "#/hooks/query/use-user-conversations";
import { ProjectStatus } from "#/components/features/conversation-panel/conversation-state-indicator";
import { useUserRepositories } from "#/hooks/query/use-user-repositories";
import { GitRepository } from "#/types/git";
import { useWizeTeamsSession } from "#/hooks/use-wize-teams-session";
import { TaskList } from "#/components/features/wize-teams/task-list";
import { RunStatus } from "#/api/wize-teams.types";
import ConversationDisplay from "#/components/features/wize-teams/conversation-display";
import { WIZE_TEAMS_CONFIG } from "#/config/teams-config";

<PrefetchPageLinks page="/conversations/:conversationId" />;

function HomeScreen() {
  const { providers } = useUserProviders();
  const { t } = useTranslation();
  const [selectedRepoTitle, setSelectedRepoTitle] = React.useState<
    string | null
  >(null);
  const [selectedRepository, setSelectedRepository] = React.useState<GitRepository | null>(null);
  // Removed tabs state as we're only showing tasks

  const {
    mutate: createConversation,
    isPending,
    isSuccess,
  } = useCreateConversation();
  const isCreatingConversationElsewhere = useIsCreatingConversation();
  const { data: conversations, isFetching, error } = useUserConversations();
  const { data: repositories, isLoading: isLoadingRepositories } = useUserRepositories();

  // Wize Teams integration
  const {
    startSession,
    sessionId,
    tasks,
    messages,
    isLoading: isLoadingWizeTeams,
    isCompleted,
    error: wizeTeamsError
  } = useWizeTeamsSession({ teamId: WIZE_TEAMS_CONFIG.DEFAULT_TEAM_ID });

  // Show notification when session is completed
  React.useEffect(() => {
    if (isCompleted && sessionId) {
      // You can implement a toast notification here if needed
      console.log('Session completed:', sessionId);
    }
  }, [isCompleted, sessionId]);

  // We check for isSuccess because the app might require time to render
  // into the new conversation screen after the conversation is created.
  const isCreatingConversation =
    isPending || isSuccess || isCreatingConversationElsewhere;

  const providersAreSet = providers.length > 0;

  const [inputValue, setInputValue] = React.useState("");

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
  };

  const handleRepoSelection = (repoId: string | null) => {
    if (!repoId || !repositories) {
      setSelectedRepository(null);
      setSelectedRepoTitle(null);
      return;
    }

    const repo = repositories.find((r: GitRepository) => r.id.toString() === repoId);
    if (repo) {
      setSelectedRepository(repo);
      setSelectedRepoTitle(repo.full_name);
    }
  };

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoadingWizeTeams) {
      // Navigate to the specification builder screen with the query and repository ID
      navigate('/specification-builder', {
        state: {
          query: inputValue,
          selectedRepositoryId: selectedRepository?.id.toString()
        }
      });
      setInputValue("");
    }
  };

  return (
    <div
      data-testid="home-screen"
      className="bg-base-secondary h-full flex flex-col px-[10px] pt-[10px] gap-8 overflow-y-auto"
    >
      <HomeHeader />

      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="w-full max-w-3xl text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">What are we coding next?</h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-3xl mb-8">
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe a task"
              className="w-full h-32 p-4 bg-base-primary border border-neutral-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className="text-sm text-neutral-400">{t("Repository")}:</span>
              <select
                value={selectedRepository?.id.toString() || ""}
                onChange={(e) => handleRepoSelection(e.target.value || null)}
                className="px-2 py-1 text-sm bg-base-primary border border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={!providersAreSet || isLoadingRepositories}
              >
                <option value="">{t("None")}</option>
                {repositories?.map((repo: GitRepository) => (
                  <option key={repo.id} value={repo.id.toString()}>
                    {repo.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                type="submit"
                disabled={isLoadingWizeTeams || !inputValue.trim()}
                className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isLoadingWizeTeams && (
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                )}
                {isLoadingWizeTeams ? t("Processing...") : t("Send")}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="flex justify-center w-full mb-4">
        <div className="w-full max-w-3xl">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("Tasks")}</h2>
          </div>

          <div className="space-y-1">
            {/* Wize Teams Session Content */}
            {sessionId && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Specification Builder</h2>
                  <div className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${getStatusStyles(isCompleted, tasks)}`}>
                    {!isCompleted && (
                      <span className="animate-pulse h-2 w-2 bg-green-300 rounded-full"></span>
                    )}
                    {getStatusText(isCompleted, tasks)}
                  </div>
                </div>

                <div className="flex gap-4">
                  {/* Left side - Chat */}
                  <div className="flex-1 bg-base-primary border border-neutral-700 rounded-md p-4">
                    <h3 className="text-md font-medium mb-2">Conversation</h3>
                    <div className="h-96 overflow-y-auto mb-4">
                      <ConversationDisplay
                        messages={messages}
                        isLoading={isLoadingWizeTeams}
                      />
                    </div>

                    {isCompleted && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={() => {
                            // Get the final specification from the team session
                            const finalMessage = messages.length > 0 ? messages[messages.length - 1] : null;

                            if (finalMessage) {
                              const specification = finalMessage.message || finalMessage.content || "";

                              // Create a conversation with the specification
                              createConversation({
                                q: `Generated specification:\n\n${specification}`,
                                selectedRepository: selectedRepository
                              });
                            }
                          }}
                          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right side - Tasks */}
                  <div className="w-1/3 bg-base-primary border border-neutral-700 rounded-md p-4">
                    <h3 className="text-md font-medium mb-2">Tasks</h3>
                    <div className="h-96 overflow-y-auto">
                      <TaskList
                        tasks={tasks}
                        isLoading={isLoadingWizeTeams}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Regular conversations section */}
            {isFetching && (
              <div className="flex justify-center py-4">
                <span className="text-sm text-neutral-400">Loading...</span>
              </div>
            )}

            {error && (
              <div className="flex justify-center py-4">
                <span className="text-sm text-red-500">{error.message}</span>
              </div>
            )}

            {!isFetching && !error && conversations?.length === 0 && (
              <div className="flex justify-center py-4">
                <span className="text-sm text-neutral-400">No conversations found</span>
              </div>
            )}

            {!isFetching && !error && conversations?.map((conversation: any) => (
              <div
                key={conversation.conversation_id}
                onClick={() => window.location.href = `/conversations/${conversation.conversation_id}`}
                className="flex items-center justify-between py-3 border-b border-neutral-700 hover:bg-neutral-800 cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{conversation.title}</span>
                  <span className="text-xs text-neutral-400">
                    {formatDate(conversation.created_at)}
                    {conversation.selected_repository && ` · ${conversation.selected_repository}`}
                  </span>
                </div>
                <div className={`text-xs ${conversation.status === 'STOPPED' ? 'text-blue-500' : 'text-green-500'}`}>
                  {conversation.status === 'STOPPED' ? 'Complete' : conversation.status === 'RUNNING' ? 'Running' : 'Starting'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for team session status display
const getStatusStyles = (isCompleted: boolean, tasks: any[]) => {
  if (isCompleted) {
    return 'bg-blue-900 text-blue-300';
  }

  // Check if there are any tasks in progress
  const hasActiveTasks = tasks.some(task => task.status === 'pending');
  if (hasActiveTasks) {
    return 'bg-green-900 text-green-300';
  }

  return 'bg-yellow-900 text-yellow-300';
};

const getStatusText = (isCompleted: boolean, tasks: any[]) => {
  if (isCompleted) {
    return 'Completed';
  }

  // Check if there are any tasks in progress
  const hasActiveTasks = tasks.some(task => task.status === 'pending');
  if (hasActiveTasks) {
    return 'In Progress';
  }

  return 'Processing';
};

export default HomeScreen;
