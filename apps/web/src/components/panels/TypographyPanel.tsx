// =============================================================================
// TypographyPanel — Font configuration for month header, day names, day numbers
// =============================================================================

import React from 'react';
import { Type } from 'lucide-react';
import { FONT_CATALOG } from '@/config/fonts';
import { useCalendarStore } from '@/store/calendarStore';

const FONT_WEIGHTS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
];

interface TypoSectionProps {
  label: string;
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
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <div style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        color: 'var(--color-accent)',
        marginBottom: 'var(--space-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        <Type size={11} />
        {label}
      </div>

      <div className="panel-section__grid">
        {/* Font family */}
        <div className="input-group" style={{ gridColumn: '1 / -1' }}>
          <label className="input-label">Fuente</label>
          <select
            className="input select input--sm"
            value={fontFamily}
            onChange={(e) => onFontFamily(e.target.value)}
          >
            {FONT_CATALOG.map((f) => (
              <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font weight */}
        <div className="input-group">
          <label className="input-label">Peso</label>
          <select
            className="input select input--sm"
            value={fontWeight}
            onChange={(e) => onFontWeight(Number(e.target.value))}
          >
            {FONT_WEIGHTS.filter((w) => availableWeights.includes(w.value)).map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font size */}
        <div className="input-group">
          <label className="input-label">Tamaño (pt)</label>
          <input
            type="number"
            className="input input--sm input-numeric"
            value={fontSizePt}
            min={4}
            max={72}
            step={1}
            onChange={(e) => onFontSize(Number(e.target.value))}
          />
        </div>

        {/* Color */}
        <div className="input-group">
          <label className="input-label">Color</label>
          <input
            type="color"
            className="input-color"
            value={color}
            onChange={(e) => onColor(e.target.value)}
          />
        </div>

        {/* Text transform */}
        {onTextTransform && (
          <div className="input-group">
            <label className="input-label">Transformar</label>
            <select
              className="input select input--sm"
              value={textTransform ?? 'none'}
              onChange={(e) => onTextTransform(e.target.value)}
            >
              <option value="none">Normal</option>
              <option value="uppercase">MAYÚSCULAS</option>
              <option value="capitalize">Capitalizar</option>
            </select>
          </div>
        )}

        {/* Text align */}
        {onTextAlign && (
          <div className="input-group">
            <label className="input-label">Alineación H.</label>
            <select
              className="input select input--sm"
              value={textAlign ?? 'center'}
              onChange={(e) => onTextAlign(e.target.value)}
            >
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </div>
        )}

        {/* Vertical align */}
        {onVerticalAlign && (
          <div className="input-group">
            <label className="input-label">Alineación V.</label>
            <select
              className="input select input--sm"
              value={verticalAlign ?? 'top'}
              onChange={(e) => onVerticalAlign(e.target.value)}
            >
              <option value="top">Arriba</option>
              <option value="middle">Medio</option>
              <option value="bottom">Abajo</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

const TypographyPanel: React.FC = () => {
  const typography = useCalendarStore((s) => s.project.globalSettings.defaultTypography);
  const setTypography = useCalendarStore((s) => s.setDefaultTypography);

  return (
    <div className="panel-section">
      <div className="panel-section__header">
        <span className="panel-section__title">Tipografía</span>
      </div>

      {/* Month Header */}
      <TypoSection
        label="Encabezado del mes"
        fontFamily={typography.monthHeader.fontFamily}
        fontWeight={typography.monthHeader.fontWeight}
        fontSizePt={typography.monthHeader.fontSizePt}
        color={typography.monthHeader.color}
        textTransform={typography.monthHeader.textTransform}
        onFontFamily={(v) => setTypography({ monthHeader: { ...typography.monthHeader, fontFamily: v } })}
        onFontWeight={(v) => setTypography({ monthHeader: { ...typography.monthHeader, fontWeight: v as 300 | 400 | 500 | 600 | 700 } })}
        onFontSize={(v) => setTypography({ monthHeader: { ...typography.monthHeader, fontSizePt: v } })}
        onColor={(v) => setTypography({ monthHeader: { ...typography.monthHeader, color: v } })}
        onTextTransform={(v) => setTypography({ monthHeader: { ...typography.monthHeader, textTransform: v as 'none' | 'uppercase' | 'capitalize' } })}
      />

      {/* Day Names */}
      <TypoSection
        label="Nombres de días"
        fontFamily={typography.dayNames.fontFamily}
        fontWeight={typography.dayNames.fontWeight}
        fontSizePt={typography.dayNames.fontSizePt}
        color={typography.dayNames.color}
        textTransform={typography.dayNames.textTransform}
        onFontFamily={(v) => setTypography({ dayNames: { ...typography.dayNames, fontFamily: v } })}
        onFontWeight={(v) => setTypography({ dayNames: { ...typography.dayNames, fontWeight: v as 300 | 400 | 500 | 600 | 700 } })}
        onFontSize={(v) => setTypography({ dayNames: { ...typography.dayNames, fontSizePt: v } })}
        onColor={(v) => setTypography({ dayNames: { ...typography.dayNames, color: v } })}
        onTextTransform={(v) => setTypography({ dayNames: { ...typography.dayNames, textTransform: v as 'none' | 'uppercase' | 'capitalize' } })}
      />

      {/* Day Numbers */}
      <TypoSection
        label="Números de días"
        fontFamily={typography.dayNumbers.fontFamily}
        fontWeight={typography.dayNumbers.fontWeight}
        fontSizePt={typography.dayNumbers.fontSizePt}
        color={typography.dayNumbers.color}
        textAlign={typography.dayNumbers.textAlign}
        verticalAlign={typography.dayNumbers.verticalAlign}
        onFontFamily={(v) => setTypography({ dayNumbers: { ...typography.dayNumbers, fontFamily: v } })}
        onFontWeight={(v) => setTypography({ dayNumbers: { ...typography.dayNumbers, fontWeight: v as 300 | 400 | 500 | 600 | 700 } })}
        onFontSize={(v) => setTypography({ dayNumbers: { ...typography.dayNumbers, fontSizePt: v } })}
        onColor={(v) => setTypography({ dayNumbers: { ...typography.dayNumbers, color: v } })}
        onTextAlign={(v) => setTypography({ dayNumbers: { ...typography.dayNumbers, textAlign: v as 'left' | 'center' | 'right' } })}
        onVerticalAlign={(v) => setTypography({ dayNumbers: { ...typography.dayNumbers, verticalAlign: v as 'top' | 'middle' | 'bottom' } })}
      />

      {/* Sunday color */}
      <div className="panel-section__row" style={{ marginTop: 'var(--space-2)' }}>
        <div className="input-group" style={{ flex: 1 }}>
          <label className="input-label">Color domingos</label>
          <input
            type="color"
            className="input-color"
            value={typography.dayNumbers.sundayColor}
            onChange={(e) =>
              setTypography({ dayNumbers: { ...typography.dayNumbers, sundayColor: e.target.value } })
            }
          />
        </div>
      </div>

    </div>
  );
};

export default TypographyPanel;
