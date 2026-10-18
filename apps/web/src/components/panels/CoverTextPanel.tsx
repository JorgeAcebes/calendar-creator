// =============================================================================
// CoverTextPanel — Edit cover text properties
// =============================================================================

import React from 'react';
import { Type } from 'lucide-react';
import type { CoverTextPosition } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';

const FONT_OPTIONS = [
  'Montserrat', 'Inter', 'Outfit', 'Roboto', 'Playfair Display',
  'Lora', 'Poppins', 'Raleway', 'Source Sans 3', 'DM Sans',
];

const POSITION_OPTIONS: { value: CoverTextPosition; label: string }[] = [
  { value: 'top-center', label: 'Arriba' },
  { value: 'center', label: 'Centro' },
  { value: 'bottom-center', label: 'Abajo' },
];

const CoverTextPanel: React.FC = () => {
  const page = useCalendarStore((s) => s.project.pages[s.editor.activePageIndex]);
  const setCoverText = useCalendarStore((s) => s.setCoverText);

  if (!page || page.type !== 'cover' || !page.coverText) return null;

  const cover = page.coverText;

  return (
    <div className="panel-section" style={{ padding: '16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--color-glass-border)',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Type size={13} color="#0a84ff" />
          Texto de Portada
        </span>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Title */}
        <div className="input-group">
          <label className="input-label" style={{ fontSize: '10px' }}>Título</label>
          <input
            type="text"
            className="input input--sm"
            value={cover.title}
            onChange={(e) => setCoverText({ title: e.target.value })}
            placeholder="Título de portada"
          />
        </div>

        {/* Subtitle */}
        <div className="input-group">
          <label className="input-label" style={{ fontSize: '10px' }}>Subtítulo</label>
          <input
            type="text"
            className="input input--sm"
            value={cover.subtitle}
            onChange={(e) => setCoverText({ subtitle: e.target.value })}
            placeholder="Subtítulo (opcional)"
          />
        </div>

        {/* Position */}
        <div className="input-group">
          <label className="input-label" style={{ fontSize: '10px' }}>Posición vertical</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            {POSITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`btn btn--sm ${cover.positionPreset === opt.value ? 'btn--primary' : 'btn--ghost'}`}
                style={{
                  fontSize: '11px',
                  padding: '5px',
                  fontWeight: cover.positionPreset === opt.value ? 600 : 400,
                }}
                onClick={() => setCoverText({ positionPreset: opt.value, xMm: undefined, yMm: undefined })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font + Size row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '10px' }}>Tipografía</label>
            <select
              className="input select input--sm"
              value={cover.fontFamily}
              onChange={(e) => setCoverText({ fontFamily: e.target.value })}
              style={{ width: '100%', fontSize: '11px' }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '10px' }}>Tamaño</label>
            <input
              type="number"
              className="input input--sm input-numeric"
              min={8}
              max={120}
              value={cover.fontSizePt}
              onChange={(e) => setCoverText({ fontSizePt: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Color */}
        <div className="input-group">
          <label className="input-label" style={{ fontSize: '10px' }}>Color del texto</label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--color-glass-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
          }}>
            <input
              type="color"
              className="input-color"
              value={cover.color}
              onChange={(e) => setCoverText({ color: e.target.value })}
              style={{ width: 26, height: 22, borderRadius: 4, cursor: 'pointer' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
              {cover.color.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverTextPanel;
