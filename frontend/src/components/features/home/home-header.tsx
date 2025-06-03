import { useTranslation } from "react-i18next";
import AllHandsLogo from "#/assets/branding/all-hands-logo-spark.svg?react";
import { ConversationPanelButton } from "#/components/shared/buttons/conversation-panel-button";
import React from "react";
import { ConversationPanel } from "../conversation-panel/conversation-panel";
import { ConversationPanelWrapper } from "../conversation-panel/conversation-panel-wrapper";
import { SettingsButton } from "#/components/shared/buttons/settings-button";

export function HomeHeader() {
  const { t } = useTranslation();

  const [conversationPanelIsOpen, setConversationPanelIsOpen] =
      React.useState(false);

  return (
    <header className="flex flex-col gap-5">

      <div className="flex flex-row items-center justify-between w-full">
        <AllHandsLogo height={50} />
        <div className="flex flex-row items-center gap-[26px]">
          {/* <ConversationPanelButton
            isOpen={conversationPanelIsOpen}
            onClick={() => setConversationPanelIsOpen((prev) => !prev)}
          /> */}
          <SettingsButton />
        </div>
      </div>


      {conversationPanelIsOpen && (
        <div className="absolute right-0 top-0 z-20">
          <ConversationPanelWrapper isOpen={conversationPanelIsOpen}>
            <div className="flex justify-end w-full">
              <ConversationPanel
                onClose={() => setConversationPanelIsOpen(false)}
              />
            </div>
          </ConversationPanelWrapper>
        </div>
      )}



      {/* <div className="flex items-center justify-between">
        <p className="text-sm max-w-[424px]">
          {t("HOME$OPENHANDS_DESCRIPTION")}
        </p>
        <p className="text-sm">
          {t("HOME$NOT_SURE_HOW_TO_START")}{" "}
          <a
            href="https://docs.all-hands.dev/usage/getting-started"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {t("HOME$READ_THIS")}
          </a>
        </p>
      </div> */}
    </header>
  );
}
