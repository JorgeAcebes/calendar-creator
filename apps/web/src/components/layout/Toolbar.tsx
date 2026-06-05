// =============================================================================
// Toolbar — Top bar with project controls
// =============================================================================

import React, { useState } from 'react';
import {
  Calendar,
  Download,
  Eye,
  EyeOff,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  Globe,
  Undo2,
  Redo2,
  Home,
  Shuffle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Locale, PaperFormat } from '@calendar-creator/shared-types';
import { PAPER_FORMATS } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';
import PdfRenderer from '../pdf/PdfRenderer';

import { useStore } from 'zustand';
import { useTranslation } from '@/hooks/useTranslation';

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'es-ES', label: '🇪🇸 Español' },
  { value: 'en-US', label: '🇺🇸 English (US)' },
  { value: 'en-GB', label: '🇬🇧 English (UK)' },
  { value: 'fr-FR', label: '🇫🇷 Français' },
  { value: 'de-DE', label: '🇩🇪 Deutsch' },
  { value: 'it-IT', label: '🇮🇹 Italiano' },
  { value: 'pt-PT', label: '🇵🇹 Português' },
  { value: 'pt-BR', label: '🇧🇷 Português (BR)' },
  { value: 'ca-ES', label: '🏳️ Català' },
];

const Toolbar: React.FC = () => {
  const { t } = useTranslation();
  const project = useCalendarStore((s) => s.project);
  const editor = useCalendarStore((s) => s.editor);
  const setProjectName = useCalendarStore((s) => s.setProjectName);
  const setProjectYear = useCalendarStore((s) => s.setProjectYear);
  const setProjectLocale = useCalendarStore((s) => s.setProjectLocale);
  const setCanvasZoom = useCalendarStore((s) => s.setCanvasZoom);
  const toggleBleedGuides = useCalendarStore((s) => s.toggleBleedGuides);
  const toggleSafeGuides = useCalendarStore((s) => s.toggleSafeGuides);
  const setPaperDimensions = useCalendarStore((s) => s.setPaperDimensions);
  
  const pastStates = useStore(useCalendarStore.temporal, (state) => state.pastStates);
  const futureStates = useStore(useCalendarStore.temporal, (state) => state.futureStates);

  const [showSettings, setShowSettings] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const navigate = useNavigate();

  const handleExportClick = () => {
    setShowExportConfirm(true);
  };

  const startExport = () => {
    setShowExportConfirm(false);
    setIsExporting(true);
    setExportProgress({ current: 0, total: project.pages.length });
  };

  return (
    <div className="toolbar">
      {/* Brand */}
      <div className="toolbar__brand">
        <div className="toolbar__brand-icon">
          <Calendar size={16} color="#fff" />
        </div>
        <span>Calendar Creator</span>
      </div>

      {/* Project name (editable) */}
      <input
        type="text"
        className="input"
        style={{
          width: 200,
          background: 'transparent',
          border: '1px solid transparent',
          textAlign: 'center',
          fontWeight: 500,
        }}
        value={project.name}
        onChange={(e) => setProjectName(e.target.value)}
        title={t('toolbar.project_name')}
      />

      {/* Center actions */}
      <div className="toolbar__actions">
        {/* Year selector */}
        <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-1)' }}>
          <label className="input-label" style={{ marginBottom: 0 }}>{t('toolbar.year')}</label>
          <input
            type="number"
            className="input input--sm input-numeric"
            value={project.year}
            min={2020}
            max={2100}
            onChange={(e) => setProjectYear(Number(e.target.value))}
            style={{ width: 110, paddingRight: 24 }}
          />
        </div>

        <div className="toolbar__separator" />

        <button
          className="btn btn--ghost btn--icon btn--sm tooltip"
          data-tooltip={t('toolbar.zoom_out')}
          onClick={() => setCanvasZoom(editor.canvasZoom - 0.1)}
          disabled={editor.canvasZoom <= 0.1}
        >
          <ZoomOut size={16} />
        </button>
        <span style={{
          fontSize: 'var(--text-xs)',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 40,
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
        }}>
          {Math.round(editor.canvasZoom * 100)}%
        </span>
        <button
          className="btn btn--ghost btn--icon btn--sm tooltip"
          data-tooltip={t('toolbar.zoom_in')}
          onClick={() => setCanvasZoom(editor.canvasZoom + 0.1)}
          disabled={editor.canvasZoom >= 4}
        >
          <ZoomIn size={16} />
        </button>
        <button
          className="btn btn--ghost btn--icon btn--sm tooltip"
          data-tooltip="Ajustar a página"
          onClick={() => {
            // Estimate the available canvas area (viewport minus sidebar, panel, toolbar, nav)
            const sidebarW = 280;
            const panelW = 320;
            const toolbarH = 48;
            const navH = 96;
            const padding = 32;
            const availW = window.innerWidth - sidebarW - panelW - padding * 2;
            const availH = window.innerHeight - toolbarH - navH - padding * 2;
            const paper = project.globalSettings.paperDimensions;
            const bleed = project.globalSettings.bleed;
            const dpi = 300;
            const totalW = (paper.widthMm + bleed.leftMm + bleed.rightMm) / 25.4 * dpi;
            const totalH = (paper.heightMm + bleed.topMm + bleed.bottomMm) / 25.4 * dpi;
            const zoom = Math.min(availW / totalW, availH / totalH);
            setCanvasZoom(Math.max(0.1, Math.min(zoom, 4)));
          }}
        >
          <Maximize2 size={16} />
        </button>

        <div className="toolbar__separator" />

        {/* Guide toggles */}
        <button
          className={`btn btn--sm ${editor.showBleedGuides ? '' : 'btn--ghost'}`}
          onClick={toggleBleedGuides}
          title={t('toolbar.bleed_guides')}
        >
          {editor.showBleedGuides ? <Eye size={14} /> : <EyeOff size={14} />}
          <span>{t('toolbar.bleed_guides')}</span>
        </button>
        <button
          className={`btn btn--sm ${editor.showSafeGuides ? '' : 'btn--ghost'}`}
          onClick={toggleSafeGuides}
          title={t('toolbar.safe_area')}
        >
          <div style={{ position: 'relative', display: 'flex' }}>
            <Grid3X3 size={14} />
            {!editor.showSafeGuides && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: -2,
                right: -2,
                height: 2,
                background: 'var(--color-error)',
                transform: 'rotate(-45deg)',
                transformOrigin: 'center',
                opacity: 0.8
              }} />
            )}
          </div>
          <span>{t('toolbar.safe_area')}</span>
        </button>

        <div className="toolbar__separator" />

        {/* Settings popover */}
        <div style={{ position: 'relative' }}>
          <button
            className={`btn btn--sm ${showSettings ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={14} />
          </button>
          {showSettings && (
            <div
              className="glass-panel glass-panel--elevated animate-scale-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                padding: 'var(--space-4)',
                width: 280,
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                background: 'rgba(28, 28, 30, 0.98)',
              }}
            >
              <div className="input-group">
                <label className="input-label">
                  <Globe size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {t('toolbar.language')}
                </label>
                <select
                  className="input select input--sm"
                  value={project.locale}
                  onChange={(e) => setProjectLocale(e.target.value as Locale)}
                >
                  {LOCALE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">{t('toolbar.paper_format')}</label>
                <select
                  className="input select input--sm"
                  value={project.globalSettings.paperDimensions.format}
                  onChange={(e) => {
                    const fmt = e.target.value as PaperFormat;
                    if (fmt !== 'custom') {
                      const dims = PAPER_FORMATS[fmt];
                      setPaperDimensions({
                        format: fmt,
                        widthMm: dims.widthMm,
                        heightMm: dims.heightMm,
                        orientation: project.globalSettings.paperDimensions.orientation,
                      });
                    }
                  }}
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="A3">A3 (297 × 420 mm)</option>
                  <option value="Letter">Letter (215.9 × 279.4 mm)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">{t('toolbar.orientation')}</label>
                <select
                  className="input select input--sm"
                  value={project.globalSettings.paperDimensions.orientation}
                  onChange={(e) => {
                    const orient = e.target.value as 'portrait' | 'landscape';
                    const currentDims = project.globalSettings.paperDimensions;
                    setPaperDimensions({
                      ...currentDims,
                      orientation: orient,
                      widthMm: orient === 'landscape' ? Math.max(currentDims.widthMm, currentDims.heightMm) : Math.min(currentDims.widthMm, currentDims.heightMm),
                      heightMm: orient === 'landscape' ? Math.min(currentDims.widthMm, currentDims.heightMm) : Math.max(currentDims.widthMm, currentDims.heightMm),
                    });
                  }}
                >
                  <option value="portrait">{t('toolbar.orientation_portrait')}</option>
                  <option value="landscape">{t('toolbar.orientation_landscape')}</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="toolbar__actions">
        <button 
          className="btn btn--sm btn--ghost" 
          onClick={() => navigate('/')}
          title={t('toolbar.home')}
        >
          <Home size={14} />
          <span>{t('toolbar.home')}</span>
        </button>

        <div className="toolbar__separator" />

        <button 
          className="btn btn--sm btn--ghost tooltip" 
          data-tooltip="Llenado aleatorio"
          onClick={() => useCalendarStore.getState().randomFillCalendar()}
        >
          <Shuffle size={14} />
          <span>{t('toolbar.auto')}</span>
        </button>

        <div className="toolbar__separator" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button 
            className={`btn btn--sm btn--icon ${pastStates.length === 0 ? 'btn--ghost opacity-50 cursor-not-allowed' : 'btn--ghost tooltip'}`}
            data-tooltip={t('toolbar.undo')}
            onClick={() => useCalendarStore.temporal.getState().undo()}
            disabled={pastStates.length === 0}
            style={{ padding: '6px 10px' }}
          >
            <Undo2 size={18} />
          </button>
          <button 
            className={`btn btn--sm btn--icon ${futureStates.length === 0 ? 'btn--ghost opacity-50 cursor-not-allowed' : 'btn--ghost tooltip'}`}
            data-tooltip={t('toolbar.redo')}
            onClick={() => useCalendarStore.temporal.getState().redo()}
            disabled={futureStates.length === 0}
            style={{ padding: '6px 10px' }}
          >
            <Redo2 size={18} />
          </button>
        </div>

        <div className="toolbar__separator" />

        <button 
          className={`btn btn--sm ${isExporting ? 'btn--ghost' : 'btn--primary'}`}
          onClick={handleExportClick}
          disabled={isExporting}
        >
          {isExporting ? (
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--color-accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <Download size={14} />
          )}
          {isExporting ? `${t('toolbar.exporting')} (${exportProgress.current}/${exportProgress.total})` : t('toolbar.export_pdf')}
        </button>
      </div>

      {/* Export Confirmation Modal */}
      {showExportConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 16,
        }}>
          <div className="glass-panel glass-panel--elevated animate-scale-in" style={{
            padding: 'var(--space-6)', maxWidth: 400, width: '100%',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{t('toolbar.export_confirm_title')}</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
              {t('toolbar.export_confirm_desc')}
            </p>
            
            <div className="input-group">
              <label className="input-label">{t('toolbar.paper_format')}</label>
              <select
                className="input select"
                value={project.globalSettings.paperDimensions.format}
                onChange={(e) => {
                  const fmt = e.target.value as PaperFormat;
                  if (fmt !== 'custom') {
                    const dims = PAPER_FORMATS[fmt];
                    setPaperDimensions({
                      format: fmt,
                      widthMm: dims.widthMm,
                      heightMm: dims.heightMm,
                      orientation: project.globalSettings.paperDimensions.orientation,
                    });
                  }
                }}
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="A3">A3 (297 × 420 mm)</option>
                <option value="Letter">Letter (215.9 × 279.4 mm)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setShowExportConfirm(false)}>{t('toolbar.cancel')}</button>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={startExport}>{t('toolbar.continue_export')}</button>
            </div>
          </div>
        </div>
      )}

      {isExporting && (
        <>
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', padding: 16,
          }}>
            <div style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-glass-border)',
              borderRadius: 20, padding: 32, maxWidth: 420, width: '100%',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              animation: 'scaleIn 0.2s ease-out both',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--color-bg-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24, border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '2px solid var(--color-accent)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8, letterSpacing: '-0.01em' }}>
                Generando PDF de Alta Resolución
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: 28, maxWidth: 300 }}>
                Renderizando a 300 DPI para calidad de imprenta. Por favor, no cierres esta ventana.
              </p>

              <div style={{
                width: '100%', background: 'var(--color-bg-tertiary)',
                borderRadius: 999, height: 10, marginBottom: 12, overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.4)',
              }}>
                <div style={{
                  background: 'var(--color-accent)', height: '100%', borderRadius: 999,
                  transition: 'width 0.3s ease-out',
                  boxShadow: '0 0 10px rgba(10,132,255,0.5)',
                  width: `${exportProgress.total > 0 ? (exportProgress.current / exportProgress.total) * 100 : 0}%`,
                }} />
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 500, letterSpacing: '0.04em' }}>
                <span>Página {exportProgress.current} de {exportProgress.total || project.pages.length}</span>
                <span>{Math.round(exportProgress.total > 0 ? (exportProgress.current / exportProgress.total) * 100 : 0)}%</span>
              </div>
            </div>
          </div>
          <PdfRenderer
            project={project}
            onProgress={(current, total) => setExportProgress({ current, total })}
            onComplete={() => setIsExporting(false)}
            onError={() => {
              alert('Error al generar PDF');
              setIsExporting(false);
            }}
          />
        </>
      )}
    </div>
  );
};

export default Toolbar;
