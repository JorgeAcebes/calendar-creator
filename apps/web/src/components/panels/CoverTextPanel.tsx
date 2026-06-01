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
    <div className="panel-section">
      <div className="panel-section__header">
        <span className="panel-section__title">
          <Type size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Texto de Portada
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Title */}
        <div className="input-group">
          <label className="input-label">Título</label>
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
          <label className="input-label">Subtítulo</label>
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
          <label className="input-label">Posición</label>
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            {POSITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`btn btn--sm ${cover.positionPreset === opt.value ? 'btn--primary' : 'btn--ghost'}`}
                style={{ flex: 1, fontSize: 'var(--text-xs)' }}
                onClick={() => setCoverText({ positionPreset: opt.value, xMm: undefined, yMm: undefined })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font + Size row */}
        <div className="panel-section__grid">
          <div className="input-group" style={{ flex: 2 }}>
            <label className="input-label">Tipografía</label>
            <select
              className="input select input--sm"
              value={cover.fontFamily}
              onChange={(e) => setCoverText({ fontFamily: e.target.value })}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Tamaño</label>
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
          <label className="input-label">Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="color"
              className="input-color"
              value={cover.color}
              onChange={(e) => setCoverText({ color: e.target.value })}
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
              {cover.color}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverTextPanel;
