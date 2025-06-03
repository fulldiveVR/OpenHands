import { useTranslation } from "react-i18next";
import { BrandButton } from "../settings/brand-button";
import { useSettings } from "#/hooks/query/use-settings";
import { useUserProviders } from "#/hooks/use-user-providers";

interface ConnectToProviderMessageProps {
  onStartWithRepo?: () => void;
}

export function ConnectToProviderMessage({ onStartWithRepo }: ConnectToProviderMessageProps) {
  const { isLoading } = useSettings();
  const { providers } = useUserProviders();
  const { t } = useTranslation();
  
  const isGitHubTokenSet = providers.includes("github");

  return (
    <div className="flex flex-col gap-4">
      <p>{t("HOME$CONNECT_PROVIDER_MESSAGE")}</p>
      <BrandButton 
        data-testid="start-with-repo-button" 
        type="button" 
        variant="primary" 
        isDisabled={isLoading || !isGitHubTokenSet}
        onClick={onStartWithRepo}
      >
        {!isLoading && "Start with Repository"}
        {isLoading && t("HOME$LOADING")}
      </BrandButton>
    </div>
  );
}
