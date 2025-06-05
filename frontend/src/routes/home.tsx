import React from "react";
import { PrefetchPageLinks, useNavigate } from "react-router";
import { HomeHeader } from "#/components/features/home/home-header";
import { useUserProviders } from "#/hooks/use-user-providers";
import { useTranslation } from "react-i18next";
import { useCreateConversation } from "#/hooks/mutation/use-create-conversation";
import { useIsCreatingConversation } from "#/hooks/use-is-creating-conversation";
import { useUserConversations } from "#/hooks/query/use-user-conversations";
import { useUserRepositories } from "#/hooks/query/use-user-repositories";
import { GitRepository } from "#/types/git";
import { useDeleteConversation } from "#/hooks/mutation/use-delete-conversation";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { BrandButton } from "#/components/features/settings/brand-button";
import { I18nKey } from "#/i18n/declaration";

<PrefetchPageLinks page="/conversations/:conversationId" />;

function HomeScreen() {
  const { providers } = useUserProviders();
  const { t } = useTranslation();
  const [selectedRepoTitle, setSelectedRepoTitle] = React.useState<
    string | null
  >(null);
  const [selectedRepository, setSelectedRepository] = React.useState<GitRepository | null>(null);
  const [conversationToDelete, setConversationToDelete] = React.useState<string | null>(null);
  // Removed tabs state as we're only showing tasks

  const { mutate: deleteConversation } = useDeleteConversation();

  const {
    mutate: createConversation,
    isPending,
    isSuccess,
  } = useCreateConversation();
  const isCreatingConversationElsewhere = useIsCreatingConversation();
  const { data: conversations, isFetching, error } = useUserConversations();

  // Check if GitHub token is set
  const hasGithubToken = providers.includes("github");

  // Only fetch repositories if GitHub token is available
  const {
    data: repositories,
    isLoading: isLoadingRepositories
  } = useUserRepositories(hasGithubToken);


  // We check for isSuccess because the app might require time to render
  // into the new conversation screen after the conversation is created.
  const isCreatingConversation =
    isPending || isSuccess || isCreatingConversationElsewhere;

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
    if (inputValue.trim()) {
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

  const handleDirectCodeBuild = () => {
    // Create a conversation to open the coding environment
    // Use input if provided, otherwise use a minimal prompt that won't auto-generate
    const query = inputValue.trim() || "";

    createConversation({
      q: query,
      selectedRepository: selectedRepository
    });
    setInputValue("");
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
              {hasGithubToken ? (
                <>
                  <span className="text-sm text-neutral-400">{t("Repository")}:</span>
                  <select
                    value={selectedRepository?.id.toString() || ""}
                    onChange={(e) => handleRepoSelection(e.target.value || null)}
                    className="px-2 py-1 text-sm bg-base-primary border border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={isLoadingRepositories}
                  >
                    <option value="">{t("Not selected")}</option>
                    {repositories?.map((repo: GitRepository) => (
                      <option key={repo.id} value={repo.id.toString()}>
                        {repo.full_name}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/settings/git')}
                  className="px-3 py-1 text-sm bg-neutral-500 text-white rounded-md hover:bg-neutral-400"
                >
                  Setup repository
                </button>
              )}
            </div>
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={handleDirectCodeBuild}
                disabled={isCreatingConversation}
                className="px-3 py-1 text-sm bg-basic text-white rounded-md hover:bg-basic/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isCreatingConversation && (
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                )}
                {isCreatingConversation ? t("Processing...") : "Code Build"}
              </button>
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {"Build Spec"}
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
                className="flex items-center justify-between py-3 border-b border-neutral-700 hover:bg-neutral-800"
              >
                <div 
                  className="flex flex-col flex-grow cursor-pointer"
                  onClick={() => window.location.href = `/conversations/${conversation.conversation_id}`}
                >
                  <span className="text-sm font-medium">{conversation.title}</span>
                  <span className="text-xs text-neutral-400">
                    {formatDate(conversation.created_at)}
                    {conversation.selected_repository && ` · ${conversation.selected_repository}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-xs ${conversation.status === 'STOPPED' ? 'text-blue-500' : 'text-green-500'}`}>
                    {conversation.status === 'STOPPED' ? 'Complete' : conversation.status === 'RUNNING' ? 'Running' : 'Starting'}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConversationToDelete(conversation.conversation_id);
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-400 p-1"
                    aria-label="Delete conversation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {conversationToDelete && (
        <ModalBackdrop>
          <ModalBody className="items-start border border-tertiary">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-medium">{t("Delete Conversation")}</h3>
              <p className="text-sm text-neutral-400">
                {t("Are you sure you want to delete this conversation? This action cannot be undone.")}
              </p>
            </div>
            <div
              className="flex flex-col gap-2 w-full mt-4"
              onClick={(event) => event.stopPropagation()}
            >
              <BrandButton
                type="button"
                variant="primary"
                onClick={() => {
                  deleteConversation(
                    { conversationId: conversationToDelete },
                    {
                      onSuccess: () => {
                        setConversationToDelete(null);
                      },
                    }
                  );
                }}
                className="w-full"
                data-testid="confirm-button"
              >
                {t("Confirm")}
              </BrandButton>
              <BrandButton
                type="button"
                variant="secondary"
                onClick={() => setConversationToDelete(null)}
                className="w-full"
                data-testid="cancel-button"
              >
                {t("Cancel")}
              </BrandButton>
            </div>
          </ModalBody>
        </ModalBackdrop>
      )}
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
