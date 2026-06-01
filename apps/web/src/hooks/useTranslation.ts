import { useCalendarStore } from '@/store/calendarStore';
import { getTranslation, TranslationKey } from '@/i18n';

export function useTranslation() {
  const locale = useCalendarStore((s) => s.project.locale);
  
  const t = (key: TranslationKey) => {
    return getTranslation(locale, key);
  };
  
  return { t, locale };
}
