// =============================================================================
// TypographyPanel — Font configuration for month header, day names, day numbers
// =============================================================================

import React, { useState } from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight, Palette, Calendar } from 'lucide-react';
import { FONT_CATALOG } from '@/config/fonts';
import { useCalendarStore } from '@/store/calendarStore';

const FONT_WEIGHTS = [
  { value: 300, label: 'Light (300)' },
  { value: 400, label: 'Regular (400)' },
  { value: 500, label: 'Medium (500)' },
  { value: 600, label: 'Semibold (600)' },
  { value: 700, label: 'Bold (700)' },
];

interface TypoSectionProps {
  label: string;
  icon?: React.ReactNode;
  fontFamily: string;
  fontWeight: number;
  fontSizePt: number;
  color: string;
  textTransform?: string;
  textAlign?: string;
  verticalAlign?: string;
  onFontFamily: (v: string) => void;
  onFontWeight: (v: number) => void;
  onFontSize: (v: number) => void;
  onColor: (v: string) => void;
  onTextTransform?: (v: string) => void;
  onTextAlign?: (v: string) => void;
  onVerticalAlign?: (v: string) => void;
}

const TypoSection: React.FC<TypoSectionProps> = ({
  label,
  icon,
  fontFamily,
  fontWeight,
  fontSizePt,
  color,
  textTransform,
  textAlign,
  verticalAlign,
  onFontFamily,
  onFontWeight,
  onFontSize,
  onColor,
  onTextTransform,
  onTextAlign,
  onVerticalAlign,
}) => {
  const fontOption = FONT_CATALOG.find((f) => f.family === fontFamily);
  const availableWeights = fontOption?.weights ?? [400];

  return (
    <div style={{
      marginBottom: '12px',
      background: 'rgba(255, 255, 255, 0.025)',
      border: '1px solid rgba(255, 255, 255, 0.07)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 14px',
    }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#0a84ff',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {icon ?? <Type size={12} />}
          {label}
        </div>
        {/* Live Mini Preview Pill */}
        <span style={{
          fontFamily,
          fontWeight,
          fontSize: '11px',
          color,
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2px 8px',
          borderRadius: '6px',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {fontFamily}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Font family selection */}
        <div className="input-group">
          <label className="input-label" style={{ fontSize: '10px', marginBottom: 3 }}>Tipografía</label>
          <select
            className="input select input--sm"
            value={fontFamily}
            onChange={(e) => onFontFamily(e.target.value)}
            style={{ width: '100%', fontSize: '12px' }}
          >
            {FONT_CATALOG.map((f) => (
              <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Weight and Size Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '10px', marginBottom: 3 }}>Peso / Grosor</label>
            <select
              className="input select input--sm"
              value={fontWeight}
              onChange={(e) => onFontWeight(Number(e.target.value))}
              style={{ width: '100%', fontSize: '11px' }}
            >
              {FONT_WEIGHTS.filter((w) => availableWeights.includes(w.value)).map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label" style={{ fontSize: '10px', marginBottom: 3 }}>Tamaño (pt)</label>
            <input
              type="number"
              className="input input--sm input-numeric"
              value={fontSizePt}
              min={4}
              max={72}
              step={1}
              onChange={(e) => onFontSize(Number(e.target.value))}
              style={{ width: '100%', fontSize: '12px' }}
            />
          </div>
        </div>

        {/* Color & Transform Row */}
        <div style={{ display: 'grid', gridTemplateColumns: onTextTransform ? '1fr 1fr' : '1fr', gap: 8 }}>
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '10px', marginBottom: 3 }}>Color</label>
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
                value={color}
                onChange={(e) => onColor(e.target.value)}
                style={{ width: 26, height: 22, borderRadius: 4, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                {color.toUpperCase()}
              </span>
            </div>
          </div>

          {onTextTransform && (
            <div className="input-group">
              <label className="input-label" style={{ fontSize: '10px', marginBottom: 3 }}>Transformar</label>
              <select
                className="input select input--sm"
                value={textTransform ?? 'none'}
                onChange={(e) => onTextTransform(e.target.value)}
                style={{ width: '100%', fontSize: '11px' }}
              >
                <option value="none">Normal</option>
                <option value="uppercase">MAYÚSCULAS</option>
                <option value="capitalize">Capitalizar</option>
              </select>
            </div>
          )}
        </div>

        {/* Text align buttons */}
        {onTextAlign && (
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '10px', marginBottom: 3 }}>Alineación horizontal</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {[
                { val: 'left', icon: <AlignLeft size={13} />, label: 'Izquierda' },
                { val: 'center', icon: <AlignCenter size={13} />, label: 'Centro' },
                { val: 'right', icon: <AlignRight size={13} />, label: 'Derecha' },
              ].map((item) => {
                const isSelected = (textAlign ?? 'center') === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => onTextAlign(item.val)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      padding: '5px',
                      fontSize: '11px',
                      fontWeight: isSelected ? 600 : 400,
                      borderRadius: 6,
                      border: isSelected ? '1px solid #0a84ff' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(10, 132, 255, 0.22)' : 'rgba(0, 0, 0, 0.15)',
                      color: isSelected ? '#0a84ff' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Vertical align buttons */}
        {onVerticalAlign && (
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '10px', marginBottom: 3 }}>Alineación vertical</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {[
                { val: 'top', label: 'Arriba' },
                { val: 'middle', label: 'Medio' },
                { val: 'bottom', label: 'Abajo' },
              ].map((item) => {
                const isSelected = (verticalAlign ?? 'top') === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => onVerticalAlign(item.val)}
                    style={{
                      padding: '5px',
                      fontSize: '11px',
                      fontWeight: isSelected ? 600 : 400,
                      borderRadius: 6,
                      border: isSelected ? '1px solid #0a84ff' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? 'rgba(10, 132, 255, 0.22)' : 'rgba(0, 0, 0, 0.15)',
                      color: isSelected ? '#0a84ff' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TypographyPanel: React.FC = () => {
  const activePageIndex = useCalendarStore((s) => s.editor.activePageIndex);
  const typography = useCalendarStore((s) => s.project.globalSettings.defaultTypography);
  const setTypography = useCalendarStore((s) => s.setDefaultTypography);
  const [applyGlobally, setApplyGlobally] = useState(true);

  const update = (typo: any) => setTypography(typo, applyGlobally, activePageIndex);

  return (
    <div className="panel-section" style={{ padding: '16px' }}>
      {/* Header with Global Toggle */}
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
          Tipografía general
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

      {/* Month Header */}
      <TypoSection
        label="Encabezado del mes"
        icon={<Calendar size={12} />}
        fontFamily={typography.monthHeader.fontFamily}
        fontWeight={typography.monthHeader.fontWeight}
        fontSizePt={typography.monthHeader.fontSizePt}
        color={typography.monthHeader.color}
        textTransform={typography.monthHeader.textTransform}
        onFontFamily={(v) => update({ monthHeader: { ...typography.monthHeader, fontFamily: v } })}
        onFontWeight={(v) => update({ monthHeader: { ...typography.monthHeader, fontWeight: v as 300 | 400 | 500 | 600 | 700 } })}
        onFontSize={(v) => update({ monthHeader: { ...typography.monthHeader, fontSizePt: v } })}
        onColor={(v) => update({ monthHeader: { ...typography.monthHeader, color: v } })}
        onTextTransform={(v) => update({ monthHeader: { ...typography.monthHeader, textTransform: v as 'none' | 'uppercase' | 'capitalize' } })}
      />

      {/* Day Names */}
      <TypoSection
        label="Nombres de días"
        icon={<Type size={12} />}
        fontFamily={typography.dayNames.fontFamily}
        fontWeight={typography.dayNames.fontWeight}
        fontSizePt={typography.dayNames.fontSizePt}
        color={typography.dayNames.color}
        textTransform={typography.dayNames.textTransform}
        onFontFamily={(v) => update({ dayNames: { ...typography.dayNames, fontFamily: v } })}
        onFontWeight={(v) => update({ dayNames: { ...typography.dayNames, fontWeight: v as 300 | 400 | 500 | 600 | 700 } })}
        onFontSize={(v) => update({ dayNames: { ...typography.dayNames, fontSizePt: v } })}
        onColor={(v) => update({ dayNames: { ...typography.dayNames, color: v } })}
        onTextTransform={(v) => update({ dayNames: { ...typography.dayNames, textTransform: v as 'none' | 'uppercase' | 'capitalize' } })}
      />

      {/* Day Numbers */}
      <TypoSection
        label="Números de días"
        icon={<Type size={12} />}
        fontFamily={typography.dayNumbers.fontFamily}
        fontWeight={typography.dayNumbers.fontWeight}
        fontSizePt={typography.dayNumbers.fontSizePt}
        color={typography.dayNumbers.color}
        textAlign={typography.dayNumbers.textAlign}
        verticalAlign={typography.dayNumbers.verticalAlign}
        onFontFamily={(v) => update({ dayNumbers: { ...typography.dayNumbers, fontFamily: v } })}
        onFontWeight={(v) => update({ dayNumbers: { ...typography.dayNumbers, fontWeight: v as 300 | 400 | 500 | 600 | 700 } })}
        onFontSize={(v) => update({ dayNumbers: { ...typography.dayNumbers, fontSizePt: v } })}
        onColor={(v) => update({ dayNumbers: { ...typography.dayNumbers, color: v } })}
        onTextAlign={(v) => update({ dayNumbers: { ...typography.dayNumbers, textAlign: v as 'left' | 'center' | 'right' } })}
        onVerticalAlign={(v) => update({ dayNumbers: { ...typography.dayNumbers, verticalAlign: v as 'top' | 'middle' | 'bottom' } })}
      />

      {/* Sunday & Holiday color card */}
      <div style={{
        background: 'rgba(255, 69, 58, 0.06)',
        border: '1px solid rgba(255, 69, 58, 0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 14px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff453a', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Palette size={12} />
            Color domingos
          </span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
            Número de los domingos
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 69, 58, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              className="input-color"
              value={typography.dayNumbers.sundayColor || '#000000'}
              onChange={(e) =>
                update({ dayNumbers: { ...typography.dayNumbers, sundayColor: e.target.value } })
              }
              style={{ width: 28, height: 24, borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}
            />
            <input
              type="text"
              className="input input--sm"
              value={typography.dayNumbers.sundayColor || '#000000'}
              onChange={(e) =>
                update({ dayNumbers: { ...typography.dayNumbers, sundayColor: e.target.value } })
              }
              onBlur={(e) => {
                let val = e.target.value.trim();
                if (val && !val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) {
                  update({ dayNumbers: { ...typography.dayNumbers, sundayColor: val } });
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

          {/* Quick preset swatches */}
          <div style={{ display: 'flex', gap: 5 }}>
            {[
              { hex: '#000000', name: 'Negro (Por defecto)' },
              { hex: '#ff453a', name: 'Rojo' },
              { hex: '#b91c1c', name: 'Granate' },
              { hex: '#d97706', name: 'Ámbar' },
              { hex: '#2563eb', name: 'Azul' },
            ].map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => update({ dayNumbers: { ...typography.dayNumbers, sundayColor: swatch.hex } })}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: swatch.hex,
                  border: (typography.dayNumbers.sundayColor || '#000000').toLowerCase() === swatch.hex.toLowerCase() ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title={swatch.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypographyPanel;
