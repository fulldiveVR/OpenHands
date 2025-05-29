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
import { t } from "i18next";
import { ConversationPanel } from "#/components/features/conversation-panel/conversation-panel";

<PrefetchPageLinks page="/conversations/:conversationId" />;

function HomeScreen() {
  const { providers } = useUserProviders();
  const { t } = useTranslation();
  const [selectedRepoTitle, setSelectedRepoTitle] = React.useState<
    string | null
  >(null);

  const {
    mutate: createConversation,
    isPending,
    isSuccess,
  } = useCreateConversation();
  const isCreatingConversationElsewhere = useIsCreatingConversation();

  // We check for isSuccess because the app might require time to render
  // into the new conversation screen after the conversation is created.
  const isCreatingConversation =
    isPending || isSuccess || isCreatingConversationElsewhere;

  const providersAreSet = providers.length > 0;

  return (
    <div
      data-testid="home-screen"
      className="bg-base-secondary h-full flex flex-col px-[10px] pt-[10px] gap-8 overflow-y-auto"
    >
      <HomeHeader />

      <ConversationPanel
          onClose={() => {}}
        />

      {/* <hr className="border-[#717888]" /> */}

      {/* <main className="flex flex-col md:flex-row justify-between gap-8">
        <div className="flex flex-col gap-4 md:w-1/2">
          <RepoConnector
            onRepoSelection={(title) => setSelectedRepoTitle(title)}
          />
        </div>

        <div className="flex flex-col gap-4 md:w-1/2 md:items-end justify-center">
          <div className="w-full md:max-w-xs">
            <BrandButton
              testId="header-launch-button"
              variant="primary"
              type="button"
              onClick={() => createConversation({})}
              isDisabled={isCreatingConversation}
              className="w-full"
            >
              {!isCreatingConversation && "Launch from Scratch"}
              {isCreatingConversation && t("HOME$LOADING")}
            </BrandButton>
          </div>
        </div>

        <hr className="md:hidden border-[#717888]" />
        {providersAreSet && <TaskSuggestions filterFor={selectedRepoTitle} />}
      </main> */}
    </div>
  );
}

export default HomeScreen;
