// =============================================================================
// PageNavigator — Bottom bar for switching between pages
// =============================================================================

import React from 'react';
import { format } from 'date-fns';
import { es, enUS, fr, de, it, pt } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { Locale } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';

const LOCALE_MAP: Record<string, DateFnsLocale> = {
  'es-ES': es, 'en-US': enUS, 'en-GB': enUS,
  'fr-FR': fr, 'de-DE': de, 'it-IT': it,
  'pt-PT': pt, 'pt-BR': pt,
};

function getMonthAbbr(month: number, locale: Locale): string {
  const d = new Date(2024, month - 1, 1);
  const loc = LOCALE_MAP[locale] ?? es;
  return format(d, 'MMM', { locale: loc }).toUpperCase();
}

const PageNavigator: React.FC = () => {
  const pages = useCalendarStore((s) => s.project.pages);
  const activeIndex = useCalendarStore((s) => s.editor.activePageIndex);
  const locale = useCalendarStore((s) => s.project.locale);
  const setActivePage = useCalendarStore((s) => s.setActivePage);

  return (
    <div className="page-nav">
      {pages.map((page: any) => (
        <button
          key={page.index}
          className={`page-nav__item ${activeIndex === page.index ? 'page-nav__item--active' : ''}`}
          onClick={() => setActivePage(page.index)}
          title={page.type === 'cover' ? 'Portada' : `Mes ${page.month}`}
        >
          {page.type === 'cover' ? (
            <>
              <span style={{ fontSize: 16 }}>📷</span>
              <span className="page-nav__item-label">PORT</span>
            </>
          ) : (
            <>
              <span className="page-nav__item-label">{getMonthAbbr(page.month!, locale)}</span>
              <span style={{ fontSize: 'var(--text-xs)', opacity: 0.5 }}>{page.index}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
};

export default PageNavigator;
