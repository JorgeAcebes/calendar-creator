// =============================================================================
// AnnotationPanel — Add, edit, and delete text annotations on specific days
// =============================================================================

import React, { useState, useEffect } from 'react';
import { MessageSquarePlus, Trash2, Check, Edit2 } from 'lucide-react';
import type { DayAnnotation } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';
import { showToast } from '@/components/layout/Toast';

const FONT_OPTIONS = [
  'Montserrat', 'Inter', 'Outfit', 'Roboto', 'Playfair Display',
  'Lora', 'Poppins', 'Raleway', 'Source Sans 3', 'DM Sans',
];

const AnnotationPanel: React.FC = () => {
  const activePageIndex = useCalendarStore((s) => s.editor.activePageIndex);
  const selectedDayStore = useCalendarStore((s) => s.editor.selectedDayForAnnotation);
  const setSelectedDayStore = useCalendarStore((s) => s.setSelectedDayForAnnotation);
  const page = useCalendarStore((s) => s.project.pages[s.editor.activePageIndex]);
  const setAnnotation = useCalendarStore((s) => s.setDayAnnotation);
  const removeAnnotation = useCalendarStore((s) => s.removeDayAnnotation);
  const clearAllAnnotations = useCalendarStore((s) => s.clearAllDayAnnotations);

  const [selectedDay, setSelectedDay] = useState<number>(selectedDayStore || 1);
  const [text, setText] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#E63946');
  const [fontSizePt, setFontSizePt] = useState(7);
  const [fontFamily, setFontFamily] = useState('Inter');

  // Sync when user clicks a day on the calendar grid
  useEffect(() => {
    if (selectedDayStore !== null && selectedDayStore !== undefined) {
      setSelectedDay(selectedDayStore);
    }
  }, [selectedDayStore]);

  if (!page || page.type !== 'month' || !page.calendarGrid) {
    return null;
  }

  const annotations = page.calendarGrid.annotations;
  const maxDays = page.month ? new Date(page.year, page.month, 0).getDate() : 31;

  // Check if an annotation already exists for the selected day
  const existingAnnotation = annotations.find(
    (a: any) => Number(a.day) === Number(selectedDay)
  );

  // When selectedDay changes or annotation updates, sync form inputs
  useEffect(() => {
    if (existingAnnotation) {
      setText(existingAnnotation.text || '');
      setColor(existingAnnotation.color || '#E63946');
      setFontSizePt(existingAnnotation.fontSizePt || 7);
      setFontFamily(existingAnnotation.fontFamily || 'Inter');
      setIcon(existingAnnotation.icon || '');
    } else {
      setText('');
      setIcon('');
    }
  }, [selectedDay, existingAnnotation?.text, existingAnnotation?.color, existingAnnotation?.icon]);

  const handleSave = () => {
    if (!text.trim()) return;
    const annotation: DayAnnotation = {
      day: Number(selectedDay),
      text: text.trim(),
      color,
      fontSizePt,
      fontFamily,
      icon: icon || undefined,
    };
    setAnnotation(activePageIndex, annotation);
    showToast({
      type: 'success',
      message: existingAnnotation
        ? `Anotación del día ${selectedDay} actualizada`
        : `Anotación guardada en el día ${selectedDay}`,
    });
  };

  const handleDeleteSelected = () => {
    removeAnnotation(activePageIndex, Number(selectedDay));
    setText('');
    setIcon('');
    showToast({
      type: 'info',
      message: `Anotación del día ${selectedDay} eliminada`,
    });
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

      <div style={{
        padding: '8px 12px',
        marginBottom: 'var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        background: existingAnnotation ? 'rgba(10, 132, 255, 0.12)' : 'var(--color-glass)',
        border: existingAnnotation ? '1px solid rgba(10, 132, 255, 0.3)' : '1px solid var(--color-glass-border)',
        fontSize: 'var(--text-xs)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>
          {existingAnnotation ? (
            <strong style={{ color: '#0a84ff' }}>Día {selectedDay} (con anotación)</strong>
          ) : (
            <span>Editando día <strong>{selectedDay}</strong></span>
          )}
        </span>
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
          Clic en cuadrícula para elegir día
        </span>
      </div>

      {/* Form to add or edit annotation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div className="panel-section__grid">
          <div className="input-group">
            <label className="input-label">Día del mes</label>
            <input
              type="number"
              className="input input--sm input-numeric"
              min={1}
              max={maxDays}
              value={selectedDay}
              onChange={(e) => {
                const val = Math.max(1, Math.min(Number(e.target.value) || 1, maxDays));
                setSelectedDay(val);
                setSelectedDayStore(val);
              }}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Color del texto</label>
            <input
              type="color"
              className="input-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Texto de la anotación</label>
          <input
            type="text"
            className="input input--sm"
            placeholder="Ej: Cumpleaños de Lucas"
            maxLength={40}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleSave}
            disabled={!text.trim()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            {existingAnnotation ? <Check size={14} /> : <MessageSquarePlus size={14} />}
            <span>{existingAnnotation ? 'Guardar cambios' : 'Añadir anotación'}</span>
          </button>

          {existingAnnotation && (
            <button
              type="button"
              className="btn btn--sm"
              onClick={handleDeleteSelected}
              style={{
                background: 'rgba(255, 69, 58, 0.15)',
                color: '#ff453a',
                border: '1px solid rgba(255, 69, 58, 0.35)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Trash2 size={14} />
              <span>Eliminar anotación del día {selectedDay}</span>
            </button>
          )}
        </div>
      </div>

      {/* Existing annotations list */}
      {annotations.length > 0 && (
        <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-glass-border)', paddingTop: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <label className="input-label" style={{ margin: 0 }}>
              Anotaciones de este mes ({annotations.length})
            </label>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ color: '#ff453a', fontSize: '11px', padding: '2px 6px', height: 'auto' }}
              onClick={() => {
                if (window.confirm('¿Seguro que quieres borrar todas las anotaciones de este mes?')) {
                  clearAllAnnotations(activePageIndex);
                  setText('');
                  setIcon('');
                  showToast({
                    type: 'info',
                    message: 'Todas las anotaciones del mes han sido eliminadas',
                  });
                }
              }}
              title="Borrar todas las anotaciones de este mes"
            >
              <Trash2 size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
              Borrar todas
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxHeight: '240px', overflowY: 'auto' }}>
            {[...annotations]
              .sort((a: any, b: any) => Number(a.day) - Number(b.day))
              .map((ann: any) => {
                const isItemActive = Number(selectedDay) === Number(ann.day);
                return (
                  <div
                    key={ann.day}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: '6px 10px',
                      background: isItemActive ? 'rgba(10, 132, 255, 0.12)' : 'var(--color-glass)',
                      border: isItemActive ? '1px solid #0a84ff' : '1px solid var(--color-glass-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      transition: 'background-color 0.15s, border-color 0.15s',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: ann.color,
                        minWidth: 26,
                        textAlign: 'center',
                        background: `${ann.color}20`,
                        padding: '2px 4px',
                        borderRadius: '4px',
                      }}
                    >
                      {ann.day}
                    </span>
                    <span
                      style={{ flex: 1, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={`Día ${ann.day}: ${ann.text} (clic para editar)`}
                      onClick={() => {
                        setSelectedDay(Number(ann.day));
                        setSelectedDayStore(Number(ann.day));
                      }}
                    >
                      {ann.icon ? `${ann.icon} ` : ''}{ann.text}
                    </span>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm btn--icon"
                      style={{ width: 24, height: 24, minWidth: 'unset', color: 'var(--color-accent)' }}
                      title="Editar esta anotación"
                      onClick={() => {
                        setSelectedDay(Number(ann.day));
                        setSelectedDayStore(Number(ann.day));
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm btn--icon"
                      style={{ width: 24, height: 24, minWidth: 'unset', color: '#ff453a' }}
                      title={`Eliminar anotación del día ${ann.day}`}
                      onClick={() => {
                        removeAnnotation(activePageIndex, Number(ann.day));
                        if (Number(selectedDay) === Number(ann.day)) {
                          setText('');
                          setIcon('');
                        }
                        showToast({
                          type: 'info',
                          message: `Anotación del día ${ann.day} eliminada`,
                        });
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationPanel;
