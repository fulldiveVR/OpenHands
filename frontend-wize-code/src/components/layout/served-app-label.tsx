import { useTranslation } from "react-i18next";
import { useActiveHost } from "#/hooks/query/use-active-host";
import { I18nKey } from "#/i18n/declaration";

export function ServedAppLabel() {
  const { t } = useTranslation();
  const { activeHost } = useActiveHost();

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">{t(I18nKey.APP$TITLE)}</div>
      </div>
      {activeHost && <div className="w-2 h-2 bg-green-500 rounded-full" />}
    </div>
  );
}
