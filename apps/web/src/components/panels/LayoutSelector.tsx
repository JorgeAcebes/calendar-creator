// =============================================================================
// LayoutSelector — Choose layout template for the active page
// =============================================================================

import React, { useState } from 'react';
import { Layout, Calendar, Grid, Check } from 'lucide-react';
import type { LayoutTemplateId, DayNamesFormat } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';
import { getLayoutsForPageType } from '@/config/layouts';
import { showToast } from '@/components/layout/Toast';

const LayoutSelector: React.FC = () => {
  const activePage = useCalendarStore((s) => s.project.pages[s.editor.activePageIndex]);
  const paper = useCalendarStore((s) => s.project.globalSettings.paperDimensions);
  const setPageLayout = useCalendarStore((s) => s.setPageLayout);
  const setGlobalIncludeYear = useCalendarStore((s) => s.setGlobalIncludeYear);
  const setGlobalDayNamesFormat = useCalendarStore((s) => s.setGlobalDayNamesFormat);
  const globalDayNamesFormat = useCalendarStore((s) => s.project.globalSettings.dayNamesFormat ?? 'short');
  const setGlobalShowGridLines = useCalendarStore((s) => s.setGlobalShowGridLines);
  const activePageIndex = useCalendarStore((s) => s.editor.activePageIndex);
  const [applyGlobally, setApplyGlobally] = useState(true);

  if (!activePage) return null;
  const layouts = getLayoutsForPageType(activePage.type, paper, useCalendarStore((s) => s.project.globalSettings.removeImageGaps));
  const removeImageGaps = useCalendarStore((s) => s.project.globalSettings.removeImageGaps);
  const setRemoveImageGaps = useCalendarStore((s) => s.setRemoveImageGaps);

  const currentDayNamesFormat: DayNamesFormat = applyGlobally
    ? globalDayNamesFormat
    : (activePage.calendarGrid?.dayNamesFormat ?? globalDayNamesFormat);

  const sliderIndex = currentDayNamesFormat === 'single' ? 0 : currentDayNamesFormat === 'short' ? 1 : 2;

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
                {layout.dropzones.map((dz: any) => {
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
                  position: 'absolute', top: 5, right: 5,
                  width: 18, height: 18,
                  background: 'var(--color-accent)', borderRadius: '50%',
                  border: '1.5px solid #000',
                  boxShadow: '0 2px 5px rgba(10, 132, 255, 0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={11} color="#ffffff" strokeWidth={3} />
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
        <div style={{
          marginTop: 'var(--space-4)',
          padding: '14px',
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Header with global toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--color-glass-border)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Grid size={13} color="#0a84ff" />
              Opciones de cuadrícula
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', cursor: 'pointer', color: applyGlobally ? '#0a84ff' : 'var(--color-text-tertiary)', fontWeight: applyGlobally ? 600 : 400 }}>
              <input
                type="checkbox"
                checked={applyGlobally}
                onChange={(e) => setApplyGlobally(e.target.checked)}
                style={{ width: 13, height: 13, accentColor: '#0a84ff', cursor: 'pointer' }}
              />
              <span>Aplicar a todo</span>
            </label>
          </div>

          {/* SLIDER: Formato de días de la semana */}
          <div style={{
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="input-label" style={{ margin: 0, fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} color="#0a84ff" />
                Abreviación de días
              </label>
              <span className="badge" style={{
                background: 'rgba(10, 132, 255, 0.15)',
                color: '#0a84ff',
                border: '1px solid rgba(10, 132, 255, 0.3)',
                fontWeight: 600,
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '12px',
              }}>
                {sliderIndex === 0 ? '1 letra (L, M, X)' : sliderIndex === 1 ? '3 letras (LUN, MAR, MIÉ)' : 'Completo'}
              </span>
            </div>

            {/* Slider control */}
            <div style={{ padding: '2px 4px' }}>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={sliderIndex}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const formatMap: DayNamesFormat[] = ['single', 'short', 'full'];
                  const newFormat = formatMap[val];
                  setGlobalDayNamesFormat(newFormat, applyGlobally, activePageIndex);
                  showToast({
                    type: 'info',
                    message: `Formato de días: ${newFormat === 'single' ? '1 letra (L, M, X)' : newFormat === 'short' ? '3 letras (LUN, MAR, MIÉ)' : 'Nombre completo'}`,
                  });
                }}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                  accentColor: '#0a84ff',
                  height: '6px',
                }}
              />
            </div>

            {/* Segmented Button Pills */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 4,
              background: 'rgba(0, 0, 0, 0.2)',
              padding: 3,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              {[
                { index: 0, format: 'single' as DayNamesFormat, label: 'L, M, X...' },
                { index: 1, format: 'short' as DayNamesFormat, label: 'LUN, MAR...' },
                { index: 2, format: 'full' as DayNamesFormat, label: 'Completo' },
              ].map((opt) => {
                const isSelected = sliderIndex === opt.index;
                return (
                  <button
                    key={opt.format}
                    type="button"
                    onClick={() => {
                      setGlobalDayNamesFormat(opt.format, applyGlobally, activePageIndex);
                      showToast({
                        type: 'info',
                        message: `Formato de días: ${opt.format === 'single' ? '1 letra (L, M, X)' : opt.format === 'short' ? '3 letras (LUN, MAR, MIÉ)' : 'Nombre completo'}`,
                      });
                    }}
                    style={{
                      padding: '4px 6px',
                      fontSize: '10px',
                      fontWeight: isSelected ? 700 : 500,
                      borderRadius: 6,
                      border: isSelected ? '1px solid rgba(10, 132, 255, 0.5)' : '1px solid transparent',
                      background: isSelected ? 'rgba(10, 132, 255, 0.22)' : 'transparent',
                      color: isSelected ? '#0a84ff' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggle: Year in month header */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500,
            padding: '8px 10px',
            background: 'rgba(0, 0, 0, 0.12)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            transition: 'background 0.15s',
          }}>
            <input
              type="checkbox"
              id={`year-toggle-${activePageIndex}`}
              checked={activePage.calendarGrid.includeYear !== false}
              onChange={(e) => {
                setGlobalIncludeYear(e.target.checked, applyGlobally, activePageIndex);
                showToast({
                  type: 'info',
                  message: applyGlobally
                    ? (e.target.checked ? 'Año incluido en todos los meses' : 'Año ocultado en todos los meses')
                    : (e.target.checked ? 'Año incluido en este mes' : 'Año ocultado en este mes'),
                });
              }}
              style={{ width: 15, height: 15, accentColor: '#0a84ff', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--color-text-primary)' }}>Incluir año al lado del mes</span>
          </label>

          {/* Toggle: Show grid lines */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500,
            padding: '8px 10px',
            background: 'rgba(0, 0, 0, 0.12)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            transition: 'background 0.15s',
          }}>
            <input
              type="checkbox"
              id={`grid-toggle-${activePageIndex}`}
              checked={activePage.calendarGrid.showGridLines}
              onChange={(e) => {
                setGlobalShowGridLines(e.target.checked, applyGlobally, activePageIndex);
              }}
              style={{ width: 15, height: 15, accentColor: '#0a84ff', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--color-text-primary)' }}>Mostrar líneas de la rejilla</span>
          </label>
        </div>
      )}

      {/* Global Setting: Image Gaps */}
      {activePage.type === 'month' && (
        <div style={{
          marginTop: 'var(--space-3)',
          padding: '12px 14px',
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500,
          }}>
            <input
              type="checkbox"
              id="remove-gaps-toggle"
              checked={removeImageGaps === true}
              onChange={(e) => setRemoveImageGaps(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: '#0a84ff', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--color-text-primary)' }}>Unir fotos sin separación (sin espacio entre marcos)</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default LayoutSelector;
