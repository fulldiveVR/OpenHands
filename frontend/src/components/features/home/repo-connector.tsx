import { useTranslation } from "react-i18next";
import { ConnectToProviderMessage } from "./connect-to-provider-message";
import { RepositorySelectionForm } from "./repo-selection-form";
import { useConfig } from "#/hooks/query/use-config";
import { RepoProviderLinks } from "./repo-provider-links";
import { useUserProviders } from "#/hooks/use-user-providers";
import { SettingsInput } from "#/components/features/settings/settings-input";
import { KeyStatusIcon } from "#/components/features/settings/key-status-icon";
import { I18nKey } from "#/i18n/declaration";
import { useSettings } from "#/hooks/query/use-settings";
import { useAddGitProviders } from "#/hooks/mutation/use-add-git-providers";
import React from "react";

interface RepoConnectorProps {
  onRepoSelection: (repoTitle: string | null) => void;
}

export function RepoConnector({ onRepoSelection }: RepoConnectorProps) {
  const { providers } = useUserProviders();
  const { data: config } = useConfig();
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const { mutate: saveGitProviders } = useAddGitProviders();

  const [githubToken, setGithubToken] = React.useState("");
  const isGitHubTokenSet = providers.includes("github");
  const isSaaS = config?.APP_MODE === "saas";
  const providersAreSet = providers.length > 0;

  const handleGitHubTokenChange = (value: string) => {
    setGithubToken(value);
    if (value) {
      saveGitProviders({
        providers: {
          github: { token: value, host: "" },
          gitlab: { token: "", host: "" },
        },
      });
    }
  };

  const handleStartWithRepo = () => {
    // If a repository is selected, pass it to the parent component
    if (providers.length > 0) {
      onRepoSelection("github");
    }
  };

  return (
    <section
      data-testid="repo-connector"
      className="w-full flex flex-col gap-6"
    >
      <h2 className="heading">{t("HOME$CONNECT_TO_REPOSITORY")}</h2>

      {!providersAreSet && (
        <div className="flex flex-col gap-4">
          <SettingsInput
            testId="github-token-input"
            name="github-token-input"
            onChange={handleGitHubTokenChange}
            label={t(I18nKey.GITHUB$TOKEN_LABEL)}
            type="password"
            className="w-full"
            placeholder={isGitHubTokenSet ? "<hidden>" : ""}
            startContent={
              isGitHubTokenSet && (
                <KeyStatusIcon
                  testId="gh-set-token-indicator"
                  isSet={isGitHubTokenSet}
                />
              )
            }
          />
          <ConnectToProviderMessage onStartWithRepo={handleStartWithRepo} />
        </div>
      )}
      {providersAreSet && (
        <RepositorySelectionForm onRepoSelection={onRepoSelection} />
      )}

      {isSaaS && providersAreSet && <RepoProviderLinks />}
    </section>
  );
}
