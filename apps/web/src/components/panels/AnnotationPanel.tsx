// =============================================================================
// AnnotationPanel — Add text annotations to specific days
// =============================================================================

import React, { useState } from 'react';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import type { DayAnnotation } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';


const FONT_OPTIONS = [
  'Montserrat', 'Inter', 'Outfit', 'Roboto', 'Playfair Display',
  'Lora', 'Poppins', 'Raleway', 'Source Sans 3', 'DM Sans',
];

const AnnotationPanel: React.FC = () => {
  const activePageIndex = useCalendarStore((s) => s.editor.activePageIndex);
  const page = useCalendarStore((s) => s.project.pages[s.editor.activePageIndex]);
  const setAnnotation = useCalendarStore((s) => s.setDayAnnotation);
  const removeAnnotation = useCalendarStore((s) => s.removeDayAnnotation);

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [text, setText] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#E63946');
  const [fontSizePt, setFontSizePt] = useState(7);
  const [fontFamily, setFontFamily] = useState('Inter');

  if (!page || page.type !== 'month' || !page.calendarGrid) {
    return null;
  }

  const annotations = page.calendarGrid.annotations;
  const maxDays = page.month ? new Date(page.year, page.month, 0).getDate() : 31;

  const handleAdd = () => {
    if (!text.trim()) return;
    const annotation: DayAnnotation = {
      day: selectedDay,
      text: text.trim(),
      color,
      fontSizePt,
      fontFamily,
      icon: icon || undefined,
    };
    setAnnotation(activePageIndex, annotation);
    setText('');
    setIcon('');
  };

  return (
    <div className="panel-section">
      <div className="panel-section__header">
        <span className="panel-section__title">
          <MessageSquarePlus size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Anotaciones
        </span>
        <span className="badge">{annotations.length}</span>
      </div>

      {/* Add new annotation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div className="panel-section__grid">
          <div className="input-group">
            <label className="input-label">Día</label>
            <input
              type="number"
              className="input input--sm input-numeric"
              min={1}
              max={maxDays}
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Color</label>
            <input
              type="color"
              className="input-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Texto</label>
          <input
            type="text"
            className="input input--sm"
            placeholder="Ej: Cumpleaños de Mamá"
            maxLength={40}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>

        {/* Font + Size */}
        <div className="panel-section__grid">
          <div className="input-group" style={{ flex: 2 }}>
            <label className="input-label">Tipografía</label>
            <select
              className="input select input--sm"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
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
              min={4}
              max={20}
              value={fontSizePt}
              onChange={(e) => setFontSizePt(Number(e.target.value))}
            />
          </div>
        </div>


        <button className="btn btn--primary btn--sm" onClick={handleAdd} disabled={!text.trim()}>
          <MessageSquarePlus size={14} />
          Añadir anotación
        </button>
      </div>

      {/* Existing annotations list */}
      {annotations.length > 0 && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <label className="input-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
            Anotaciones actuales
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {annotations
              .sort((a: any, b: any) => a.day - b.day)
              .map((ann: any) => (
                <div
                  key={ann.day}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-1) var(--space-2)',
                    background: 'var(--color-glass)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <span style={{
                    fontWeight: 700,
                    color: ann.color,
                    minWidth: 24,
                    textAlign: 'center',
                  }}>
                    {ann.day}
                  </span>
                  <span style={{ flex: 1 }} className="truncate">
                    {ann.icon} {ann.text}
                  </span>
                  <button
                    className="btn btn--ghost btn--sm btn--icon"
                    style={{ width: 22, height: 22, minWidth: 'unset' }}
                    onClick={() => removeAnnotation(activePageIndex, ann.day)}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationPanel;
