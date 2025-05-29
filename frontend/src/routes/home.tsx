import React from "react";
import { PrefetchPageLinks } from "react-router";
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

<PrefetchPageLinks page="/conversations/:conversationId" />;

function HomeScreen() {
  const { providers } = useUserProviders();
  const { t } = useTranslation();
  const [selectedRepoTitle, setSelectedRepoTitle] = React.useState<
    string | null
  >(null);
  // Removed tabs state as we're only showing tasks

  const {
    mutate: createConversation,
    isPending,
    isSuccess,
  } = useCreateConversation();
  const isCreatingConversationElsewhere = useIsCreatingConversation();
  const { data: conversations, isFetching, error } = useUserConversations();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isCreatingConversation) {
      createConversation({ q: inputValue });
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
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                type="button"
                className="px-3 py-1 text-sm border border-neutral-700 rounded-md hover:bg-neutral-800"
              >
                {t("main")}
              </button>
              <button
                type="submit"
                disabled={isCreatingConversation || !inputValue.trim()}
                className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingConversation ? t("HOME$LOADING") : t("Ask")}
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
            
            {!isFetching && !error && conversations?.map((conversation) => (
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

export default HomeScreen;
