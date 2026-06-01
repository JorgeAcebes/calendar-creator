import { Locale } from '@calendar-creator/shared-types';

export const translations = {
  'es-ES': {
    'toolbar.project_name': 'Nombre del proyecto',
    'toolbar.year': 'Año',
    'toolbar.zoom_out': 'Alejar',
    'toolbar.zoom_in': 'Acercar',
    'toolbar.bleed_guides': 'Guías de sangría',
    'toolbar.safe_area': 'Área segura',
    'toolbar.language': 'Idioma',
    'toolbar.paper_format': 'Formato de papel',
    'toolbar.orientation': 'Orientación',
    'toolbar.orientation_portrait': 'Vertical (Portrait)',
    'toolbar.orientation_landscape': 'Horizontal (Landscape)',
    'toolbar.home': 'Inicio',
    'toolbar.auto': 'Auto',
    'toolbar.undo': 'Deshacer',
    'toolbar.redo': 'Rehacer',
    'toolbar.export_pdf': 'Exportar PDF',
    'toolbar.exporting': 'Exportando',
    'toolbar.export_confirm_title': 'Confirmar Exportación',
    'toolbar.export_confirm_desc': '¿Deseas modificar el tamaño del calendario antes de exportar?',
    'toolbar.cancel': 'Cancelar',
    'toolbar.continue_export': 'Continuar Exportación',

    'panel.photos': 'Fotos',
    'panel.layouts': 'Plantillas',
    'panel.cover': 'Portada',
    'panel.text': 'Anotaciones',

    'donate.button': 'Apoya el Proyecto',
  },
  'en-US': {
    'toolbar.project_name': 'Project name',
    'toolbar.year': 'Year',
    'toolbar.zoom_out': 'Zoom out',
    'toolbar.zoom_in': 'Zoom in',
    'toolbar.bleed_guides': 'Bleed guides',
    'toolbar.safe_area': 'Safe area',
    'toolbar.language': 'Language',
    'toolbar.paper_format': 'Paper format',
    'toolbar.orientation': 'Orientation',
    'toolbar.orientation_portrait': 'Portrait',
    'toolbar.orientation_landscape': 'Landscape',
    'toolbar.home': 'Home',
    'toolbar.auto': 'Auto',
    'toolbar.undo': 'Undo',
    'toolbar.redo': 'Redo',
    'toolbar.export_pdf': 'Export PDF',
    'toolbar.exporting': 'Exporting',
    'toolbar.export_confirm_title': 'Confirm Export',
    'toolbar.export_confirm_desc': 'Do you want to change the calendar size before exporting?',
    'toolbar.cancel': 'Cancel',
    'toolbar.continue_export': 'Continue Export',

    'panel.photos': 'Photos',
    'panel.layouts': 'Layouts',
    'panel.cover': 'Cover',
    'panel.text': 'Annotations',

    'donate.button': 'Support the Project',
  }
};

export type TranslationKey = keyof typeof translations['es-ES'];

export function getTranslation(locale: Locale, key: TranslationKey): string {
  const langGroup = locale.startsWith('en') ? 'en-US' : 'es-ES';
  return translations[langGroup]?.[key] || translations['es-ES'][key] || key;
}
