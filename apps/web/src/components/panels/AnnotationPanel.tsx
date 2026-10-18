// =============================================================================
// AnnotationPanel — Add, edit, and delete annotations & Spanish public holidays
// =============================================================================

import React, { useState, useEffect } from 'react';
import { MessageSquarePlus, Trash2, Check, Edit2, Calendar, MapPin } from 'lucide-react';
import type { DayAnnotation } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';
import { showToast } from '@/components/layout/Toast';
import { SPANISH_PROVINCES } from '@/utils/spanishHolidays';

const FONT_OPTIONS = [
  'Montserrat', 'Inter', 'Outfit', 'Roboto', 'Playfair Display',
  'Lora', 'Poppins', 'Raleway', 'Source Sans 3', 'DM Sans',
];

function toValidHex(color: string | undefined, defaultColor = '#000000'): string {
  if (!color) return defaultColor;
  let c = color.trim();
  if (!c.startsWith('#')) c = '#' + c;
  if (/^#[0-9A-Fa-f]{6}$/.test(c)) return c;
  if (/^#[0-9A-Fa-f]{3}$/.test(c)) {
    return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  }
  return defaultColor;
}

const AnnotationPanel: React.FC = () => {
  const activePageIndex = useCalendarStore((s) => s.editor.activePageIndex);
  const selectedDayStore = useCalendarStore((s) => s.editor.selectedDayForAnnotation);
  const setSelectedDayStore = useCalendarStore((s) => s.setSelectedDayForAnnotation);
  const page = useCalendarStore((s) => s.project.pages[s.editor.activePageIndex]);
  const allPages = useCalendarStore((s) => s.project.pages);
  const setAnnotation = useCalendarStore((s) => s.setDayAnnotation);
  const removeAnnotation = useCalendarStore((s) => s.removeDayAnnotation);
  const clearAllAnnotations = useCalendarStore((s) => s.clearAllDayAnnotations);

  const holidayProvince = useCalendarStore((s) => s.project.globalSettings.holidayProvince ?? '');
  const includeNationalHolidays = useCalendarStore((s) => s.project.globalSettings.includeNationalHolidays ?? false);
  const applySpanishHolidays = useCalendarStore((s) => s.applySpanishHolidays);
  const clearSpanishHolidays = useCalendarStore((s) => s.clearSpanishHolidays);
  const setHolidayStyle = useCalendarStore((s) => s.setHolidayStyle);
  const globalHolidayTextPos = useCalendarStore((s) => s.project.globalSettings.holidayTextPosition ?? 'bottom');
  const globalHolidayFillBg = useCalendarStore((s) => s.project.globalSettings.holidayFillBackground ?? false);
  const globalHolidayBgColor = useCalendarStore((s) => s.project.globalSettings.holidayBackgroundColor ?? '#ffebee');
  const globalHolidayColor = useCalendarStore((s) => s.project.globalSettings.holidayColor ?? '#000000');

  const [selectedDay, setSelectedDay] = useState<number>(selectedDayStore || 1);
  const [text, setText] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#000000');
  const [fontSizePt, setFontSizePt] = useState(7);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [annTextPos, setAnnTextPos] = useState<'top' | 'middle' | 'bottom'>('bottom');
  const [annFillBg, setAnnFillBg] = useState<boolean>(false);
  const [annBgColor, setAnnBgColor] = useState<string>('#ffebee');

  const [includeNational, setIncludeNational] = useState<boolean>(includeNationalHolidays);
  const [selectedProvince, setSelectedProvince] = useState<string>(holidayProvince);
  const [applyHolidayGlobally, setApplyHolidayGlobally] = useState<boolean>(true);

  useEffect(() => {
    setIncludeNational(includeNationalHolidays);
  }, [includeNationalHolidays]);

  useEffect(() => {
    setSelectedProvince(holidayProvince);
  }, [holidayProvince]);

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

  const hasHolidaysApplied = allPages.some(
    (p) => p.calendarGrid?.annotations?.some((a: any) => a.isHoliday)
  );

  // Check if an annotation already exists for the selected day
  const existingAnnotation = annotations.find(
    (a: any) => Number(a.day) === Number(selectedDay)
  );

  // When selectedDay changes or annotation updates, sync form inputs
  useEffect(() => {
    if (existingAnnotation) {
      setText(existingAnnotation.text ? existingAnnotation.text.replace(/^🔴\s*/, '') : '');
      setColor(existingAnnotation.color || (existingAnnotation.isHoliday ? globalHolidayColor : '#000000'));
      setFontSizePt(existingAnnotation.fontSizePt || 7);
      setFontFamily(existingAnnotation.fontFamily || 'Inter');
      setIcon(existingAnnotation.isHoliday ? '' : (existingAnnotation.icon || ''));
      setAnnTextPos(existingAnnotation.textPosition || (existingAnnotation.isHoliday ? globalHolidayTextPos : 'bottom'));
      setAnnFillBg(existingAnnotation.fillBackground ?? (existingAnnotation.isHoliday ? globalHolidayFillBg : false));
      setAnnBgColor(existingAnnotation.backgroundColor || (existingAnnotation.isHoliday ? globalHolidayBgColor : '#ffebee'));
    } else {
      setText('');
      setIcon('');
      setColor('#000000');
      setAnnTextPos('bottom');
      setAnnFillBg(false);
      setAnnBgColor('#ffebee');
    }
  }, [
    selectedDay,
    existingAnnotation?.text,
    existingAnnotation?.color,
    existingAnnotation?.icon,
    existingAnnotation?.textPosition,
    existingAnnotation?.fillBackground,
    existingAnnotation?.backgroundColor,
    globalHolidayTextPos,
    globalHolidayFillBg,
    globalHolidayBgColor,
  ]);

  const handleSave = () => {
    if (!text.trim()) return;
    const annotation: DayAnnotation = {
      day: Number(selectedDay),
      text: text.trim(),
      color,
      fontSizePt,
      fontFamily,
      icon: icon || undefined,
      isHoliday: existingAnnotation?.isHoliday,
      holidayType: existingAnnotation?.holidayType,
      textPosition: annTextPos,
      fillBackground: annFillBg,
      backgroundColor: annFillBg ? annBgColor : undefined,
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
          <MessageSquarePlus size={13} color="#ff453a" />
          Notas y Festivos
        </span>
        <span className="badge" style={{ background: 'rgba(255, 69, 58, 0.15)', color: '#ff453a' }}>{annotations.length}</span>
      </div>

      {/* SECTION: Festivos Oficiales (España) */}
      <div style={{
        padding: '14px',
        marginBottom: '14px',
        background: 'rgba(255, 69, 58, 0.05)',
        border: '1px solid rgba(255, 69, 58, 0.22)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#ff453a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} />
            Festivos Oficiales (España)
          </span>
          {hasHolidaysApplied && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              style={{ fontSize: '11px', color: '#ff453a', padding: '2px 6px', height: 'auto' }}
              onClick={() => {
                clearSpanishHolidays();
                showToast({ type: 'info', message: 'Festivos automáticos eliminados del calendario' });
              }}
              title="Quitar festivos automáticos del calendario"
            >
              <Trash2 size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
              Quitar festivos
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* National Holidays Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={includeNational}
              onChange={(e) => {
                const checked = e.target.checked;
                setIncludeNational(checked);
                const currentHolidayColor = applyHolidayGlobally ? globalHolidayColor : (page.calendarGrid?.holidayColor ?? globalHolidayColor);
                if (checked || selectedProvince) {
                  applySpanishHolidays(checked, selectedProvince || undefined, currentHolidayColor);
                  showToast({
                    type: 'success',
                    message: checked ? 'Festivos nacionales marcados en todo el calendario' : 'Festivos nacionales desactivados',
                  });
                } else {
                  clearSpanishHolidays();
                }
              }}
              style={{ width: 16, height: 16, accentColor: '#ff453a', cursor: 'pointer' }}
            />
            <span>Marcar festivos a nivel nacional</span>
          </label>

          {/* Province Selector */}
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <MapPin size={12} color="#ff453a" />
              Festivos autonómicos por provincia
            </label>
            <select
              className="input select input--sm"
              value={selectedProvince}
              onChange={(e) => {
                const provId = e.target.value;
                setSelectedProvince(provId);
                const currentHolidayColor = applyHolidayGlobally ? globalHolidayColor : (page.calendarGrid?.holidayColor ?? globalHolidayColor);
                applySpanishHolidays(includeNational, provId || undefined, currentHolidayColor);
                const provName = SPANISH_PROVINCES.find((p) => p.id === provId)?.name;
                showToast({
                  type: 'success',
                  message: provId
                    ? `Festivos de ${provName} aplicados a todo el calendario`
                    : 'Festivos provinciales desactivados',
                });
              }}
              style={{ width: '100%', fontSize: '12px' }}
            >
              <option value="">-- Sin provincia seleccionada --</option>
              {SPANISH_PROVINCES.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name} ({prov.community})
                </option>
              ))}
            </select>
          </div>

          {/* Sub-section: Personalización de festivos */}
          <div style={{
            marginTop: '6px',
            paddingTop: '10px',
            borderTop: '1px dashed rgba(255, 69, 58, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* Holiday Color (text and number) */}
            <div>
              <label className="input-label" style={{ fontSize: '11px', marginBottom: '6px', display: 'block' }}>
                Color de los días festivos (número y texto)
              </label>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 69, 58, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    className="input-color"
                    value={toValidHex(applyHolidayGlobally ? globalHolidayColor : (page.calendarGrid?.holidayColor ?? globalHolidayColor))}
                    onChange={(e) => setHolidayStyle({ holidayColor: e.target.value }, applyHolidayGlobally, activePageIndex)}
                    style={{ width: 28, height: 26, borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}
                    title="Elegir color personalizado"
                  />
                  <input
                    type="text"
                    className="input input--sm"
                    placeholder="#000000"
                    value={applyHolidayGlobally ? globalHolidayColor : (page.calendarGrid?.holidayColor ?? globalHolidayColor)}
                    onChange={(e) => setHolidayStyle({ holidayColor: e.target.value }, applyHolidayGlobally, activePageIndex)}
                    onBlur={(e) => {
                      let val = e.target.value.trim();
                      if (val && !val.startsWith('#')) val = '#' + val;
                      if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) {
                        setHolidayStyle({ holidayColor: val }, applyHolidayGlobally, activePageIndex);
                      }
                    }}
                    style={{
                      width: '85px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: 'monospace',
                    }}
                  />

                  {/* Preset swatches */}
                  <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {[
                      { hex: '#000000', name: 'Negro (Por defecto)' },
                      { hex: '#1A1A2E', name: 'Azul marino oscuro' },
                      { hex: '#ff453a', name: 'Rojo vibrante' },
                      { hex: '#e63946', name: 'Carmesí' },
                      { hex: '#b91c1c', name: 'Granate' },
                      { hex: '#d97706', name: 'Ámbar' },
                      { hex: '#2563eb', name: 'Azul' },
                      { hex: '#059669', name: 'Verde' },
                      { hex: '#7c3aed', name: 'Púrpura' },
                    ].map((swatch) => {
                      const currentColor = applyHolidayGlobally ? globalHolidayColor : (page.calendarGrid?.holidayColor ?? globalHolidayColor);
                      const isSelected = currentColor.toLowerCase() === swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => setHolidayStyle({ holidayColor: swatch.hex }, applyHolidayGlobally, activePageIndex)}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            background: swatch.hex,
                            border: isSelected ? '2px solid white' : '1px solid rgba(255,255,255,0.25)',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          title={swatch.name}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Text Position */}
            <div>
              <label className="input-label" style={{ fontSize: '11px', marginBottom: '6px', display: 'block' }}>
                Posición del texto en la casilla
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {(['top', 'middle', 'bottom'] as const).map((pos) => {
                  const label = pos === 'top' ? 'Arriba' : pos === 'middle' ? 'Medio' : 'Abajo';
                  const isSelected = (applyHolidayGlobally ? globalHolidayTextPos : (page.calendarGrid?.holidayTextPosition ?? globalHolidayTextPos)) === pos;
                  return (
                    <button
                      key={pos}
                      type="button"
                      className={`btn btn--sm ${isSelected ? 'btn--primary' : 'btn--ghost'}`}
                      style={{
                        padding: '4px 6px',
                        fontSize: '11px',
                        fontWeight: isSelected ? 600 : 400,
                        backgroundColor: isSelected ? '#ff453a' : 'transparent',
                        borderColor: isSelected ? '#ff453a' : 'var(--color-glass-border)',
                        color: isSelected ? '#ffffff' : 'var(--color-text-primary)',
                      }}
                      onClick={() => setHolidayStyle({ textPosition: pos }, applyHolidayGlobally, activePageIndex)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Color Fill Toggle & Color Picker */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={applyHolidayGlobally ? globalHolidayFillBg : (page.calendarGrid?.holidayFillBackground ?? globalHolidayFillBg)}
                  onChange={(e) => setHolidayStyle({ fillBackground: e.target.checked }, applyHolidayGlobally, activePageIndex)}
                  style={{ width: 16, height: 16, accentColor: '#ff453a', cursor: 'pointer' }}
                />
                <span>Rellenar fondo de la casilla (cuadrado completo)</span>
              </label>

              {(applyHolidayGlobally ? globalHolidayFillBg : (page.calendarGrid?.holidayFillBackground ?? globalHolidayFillBg)) && (
                <div style={{ marginTop: '8px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      className="input-color"
                      value={applyHolidayGlobally ? globalHolidayBgColor : (page.calendarGrid?.holidayBackgroundColor ?? globalHolidayBgColor)}
                      onChange={(e) => setHolidayStyle({ backgroundColor: e.target.value }, applyHolidayGlobally, activePageIndex)}
                      style={{ width: '32px', height: '28px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--color-glass-border)' }}
                    />
                    <span style={{ fontSize: '11px', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-secondary)' }}>
                      {(applyHolidayGlobally ? globalHolidayBgColor : (page.calendarGrid?.holidayBackgroundColor ?? globalHolidayBgColor)).toUpperCase()}
                    </span>
                  </div>

                  {/* Preset swatches */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[
                      { name: 'Rojo suave', hex: '#ffebee' },
                      { name: 'Coral pastel', hex: '#fee2e2' },
                      { name: 'Naranja suave', hex: '#ffedd5' },
                      { name: 'Amarillo suave', hex: '#fef9c3' },
                      { name: 'Azul suave', hex: '#e0f2fe' },
                      { name: 'Lavanda', hex: '#f3e8ff' },
                    ].map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setHolidayStyle({ backgroundColor: swatch.hex }, applyHolidayGlobally, activePageIndex)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          backgroundColor: swatch.hex,
                          border: (applyHolidayGlobally ? globalHolidayBgColor : (page.calendarGrid?.holidayBackgroundColor ?? globalHolidayBgColor)).toLowerCase() === swatch.hex.toLowerCase() ? '2px solid #ff453a' : '1px solid rgba(0,0,0,0.15)',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        title={swatch.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Apply Globally Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer', marginTop: '2px' }}>
              <input
                type="checkbox"
                checked={applyHolidayGlobally}
                onChange={(e) => setApplyHolidayGlobally(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: '#ff453a', cursor: 'pointer' }}
              />
              <span>Aplicar estilo de festivos a todo el calendario</span>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION: Anotaciones Manuales Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px',
        marginBottom: '14px',
      }}>
        {/* Active Day Banner */}
        <div style={{
          padding: '8px 12px',
          marginBottom: '12px',
          borderRadius: 'var(--radius-sm)',
          background: existingAnnotation ? 'rgba(10, 132, 255, 0.12)' : 'rgba(0, 0, 0, 0.2)',
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
              <label className="input-label" style={{ fontSize: '10px' }}>Día del mes</label>
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
              <label className="input-label" style={{ fontSize: '10px' }}>Color del texto</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="color"
                  className="input-color"
                  value={toValidHex(color)}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: 28, height: 26, borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}
                />
                <input
                  type="text"
                  className="input input--sm"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  onBlur={(e) => {
                    let val = e.target.value.trim();
                    if (val && !val.startsWith('#')) val = '#' + val;
                    if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) {
                      setColor(val);
                    }
                  }}
                  style={{
                    width: '80px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontVariantNumeric: 'tabular-nums',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" style={{ fontSize: '10px' }}>Texto de la anotación</label>
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
              <label className="input-label" style={{ fontSize: '10px' }}>Tipografía</label>
              <select
                className="input select input--sm"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                style={{ width: '100%', fontSize: '11px' }}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label" style={{ fontSize: '10px' }}>Tamaño</label>
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

          {/* Text Position for this annotation */}
          <div>
            <label className="input-label" style={{ fontSize: '10px', marginBottom: '6px', display: 'block' }}>
              Posición del texto en la casilla
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {(['top', 'middle', 'bottom'] as const).map((pos) => {
                const label = pos === 'top' ? 'Arriba' : pos === 'middle' ? 'Medio' : 'Abajo';
                const isSelected = annTextPos === pos;
                return (
                  <button
                    key={pos}
                    type="button"
                    className={`btn btn--sm ${isSelected ? 'btn--primary' : 'btn--ghost'}`}
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                    onClick={() => setAnnTextPos(pos)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fill Background for this annotation */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={annFillBg}
                onChange={(e) => setAnnFillBg(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#0a84ff', cursor: 'pointer' }}
              />
              <span>Rellenar fondo de la casilla</span>
            </label>

            {annFillBg && (
              <div style={{ marginTop: '8px', paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  className="input-color"
                  value={toValidHex(annBgColor, '#ffebee')}
                  onChange={(e) => setAnnBgColor(e.target.value)}
                  style={{ width: '28px', height: '24px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--color-glass-border)', flexShrink: 0 }}
                />
                <input
                  type="text"
                  className="input input--sm"
                  value={annBgColor}
                  onChange={(e) => setAnnBgColor(e.target.value)}
                  onBlur={(e) => {
                    let val = e.target.value.trim();
                    if (val && !val.startsWith('#')) val = '#' + val;
                    if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) {
                      setAnnBgColor(val);
                    }
                  }}
                  style={{
                    width: '80px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontVariantNumeric: 'tabular-nums',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: '4px' }}>
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
      </div>

      {/* Existing annotations list */}
      {annotations.length > 0 && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label className="input-label" style={{ margin: 0, fontSize: '11px', fontWeight: 600 }}>
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
                    key={`${ann.day}-${ann.text}`}
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
                      {(!ann.isHoliday && ann.icon && ann.icon !== '🔴') ? `${ann.icon} ` : ''}{ann.text.replace(/^🔴\s*/, '')}
                      {ann.isHoliday && (
                        <span style={{ fontSize: '10px', marginLeft: 6, opacity: 0.65, fontStyle: 'italic' }}>
                          ({ann.holidayType === 'national' ? 'festivo nacional' : 'festivo provincial'})
                        </span>
                      )}
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
