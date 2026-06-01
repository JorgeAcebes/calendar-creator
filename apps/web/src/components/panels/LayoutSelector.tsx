// =============================================================================
// LayoutSelector — Choose layout template for the active page
// =============================================================================

import React from 'react';
import { Layout } from 'lucide-react';
import type { LayoutTemplateId } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';
import { getLayoutsForPageType } from '@/config/layouts';

const LayoutSelector: React.FC = () => {
  const activePage = useCalendarStore((s) => s.project.pages[s.editor.activePageIndex]);
  const paper = useCalendarStore((s) => s.project.globalSettings.paperDimensions);
  const setPageLayout = useCalendarStore((s) => s.setPageLayout);
  const updateGridConfig = useCalendarStore((s) => s.updateGridConfig);
  const activePageIndex = useCalendarStore((s) => s.editor.activePageIndex);

  if (!activePage) return null;
  const layouts = getLayoutsForPageType(activePage.type, paper, useCalendarStore((s) => s.project.globalSettings.removeImageGaps));
  const removeImageGaps = useCalendarStore((s) => s.project.globalSettings.removeImageGaps);
  const setRemoveImageGaps = useCalendarStore((s) => s.setRemoveImageGaps);

  return (
    <div className="panel-section">
      <div className="panel-section__header">
        <span className="panel-section__title">
          <Layout size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Maquetación
        </span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginTop: 12,
      }}>
        {layouts.map((layout) => {
          const isActive = activePage.layoutTemplateId === layout.id;
          return (
            <button
              key={layout.id}
              style={{
                position: 'relative',
                background: 'var(--color-bg-secondary)',
                border: `2px solid ${isActive ? 'var(--color-accent)' : 'var(--color-bg-elevated)'}`,
                borderRadius: 12,
                aspectRatio: '21 / 29',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                padding: 0,
              }}
              onClick={() => setPageLayout(activePageIndex, layout.id as LayoutTemplateId)}
              title={layout.description}
            >
              <div style={{
                position: 'absolute',
                inset: 5,
                background: '#ffffff',
                borderRadius: 6,
                overflow: 'hidden',
              }}>
                {/* Image Zones */}
                {layout.dropzones.map((dz) => {
                  const xPct = (dz.xMm / paper.widthMm) * 100;
                  const yPct = (dz.yMm / paper.heightMm) * 100;
                  const wPct = (dz.widthMm / paper.widthMm) * 100;
                  const hPct = (dz.heightMm / paper.heightMm) * 100;
                  return (
                    <div
                      key={dz.id}
                      style={{
                        position: 'absolute',
                        background: '#eaeaef',
                        border: '0.5px solid white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        left: `${xPct}%`,
                        top: `${yPct}%`,
                        width: `${wPct}%`,
                        height: `${hPct}%`,
                      }}
                    >
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c0c0c8' }} />
                    </div>
                  );
                })}
                {/* Calendar Grid Zone */}
                {layout.calendarGridPosition && (
                  <div
                    style={{
                      position: 'absolute',
                      border: '0.5px dashed #c0c0c8',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      padding: 2,
                      left: `${(layout.calendarGridPosition.xMm / paper.widthMm) * 100}%`,
                      top: `${(layout.calendarGridPosition.yMm / paper.heightMm) * 100}%`,
                      width: `${(layout.calendarGridPosition.widthMm / paper.widthMm) * 100}%`,
                      height: `${(layout.calendarGridPosition.heightMm / paper.heightMm) * 100}%`,
                    }}
                  >
                    <div style={{ flex: 1, borderTop: '1px solid #eaeaef' }} />
                    <div style={{ flex: 1, borderTop: '1px solid #eaeaef' }} />
                    <div style={{ flex: 1, borderTop: '1px solid #eaeaef' }} />
                    <div style={{ flex: 1, borderTop: '1px solid #eaeaef' }} />
                  </div>
                )}
              </div>

              {isActive && (
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 14, height: 14,
                  background: 'var(--color-accent)', borderRadius: '50%',
                  border: '1px solid black',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-tertiary)',
        marginTop: 'var(--space-2)',
        textAlign: 'center',
      }}>
        {layouts.find((l) => l.id === activePage.layoutTemplateId)?.name}
      </p>

      {activePage.calendarGrid && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id={`grid-toggle-${activePageIndex}`}
              checked={activePage.calendarGrid.showGridLines}
              onChange={(e) => updateGridConfig(activePageIndex, { showGridLines: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
            />
            <label htmlFor={`grid-toggle-${activePageIndex}`} className="input-label" style={{ marginBottom: 0, cursor: 'pointer', textTransform: 'none' }}>
              Mostrar líneas de la rejilla
            </label>
          </div>
          <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id={`year-toggle-${activePageIndex}`}
              checked={activePage.calendarGrid.includeYear !== false}
              onChange={(e) => updateGridConfig(activePageIndex, { includeYear: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
            />
            <label htmlFor={`year-toggle-${activePageIndex}`} className="input-label" style={{ marginBottom: 0, cursor: 'pointer', textTransform: 'none' }}>
              Incluir Año
            </label>
          </div>
          <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id={`short-day-toggle-${activePageIndex}`}
              checked={activePage.calendarGrid.shortDayNames !== false}
              onChange={(e) => updateGridConfig(activePageIndex, { shortDayNames: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
            />
            <label htmlFor={`short-day-toggle-${activePageIndex}`} className="input-label" style={{ marginBottom: 0, cursor: 'pointer', textTransform: 'none' }}>
              Nombres de días acortados
            </label>
          </div>
        </div>
      )}

      {/* Global Setting: Image Gaps */}
      {activePage.type === 'month' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="remove-gaps-toggle"
              checked={removeImageGaps === true}
              onChange={(e) => setRemoveImageGaps(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
            />
            <label htmlFor="remove-gaps-toggle" className="input-label" style={{ marginBottom: 0, cursor: 'pointer', textTransform: 'none' }}>
              Unir fotos sin separación
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutSelector;
