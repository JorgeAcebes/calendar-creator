// =============================================================================
// CalendarGrid — Renders the month grid (header + day names + day numbers)
// =============================================================================
// Renders entirely with Konva shapes and text for pixel-perfect control.
// Respects typography settings from the store.
// =============================================================================

import React, { useMemo } from 'react';
import { Group, Text, Line, Rect } from 'react-konva';
import type {
  CalendarGridConfig,
  DefaultTypography,
  DayAnnotation,
  Locale,
  VerticalAlign,
} from '@calendar-creator/shared-types';
import { mmToPx } from '@calendar-creator/shared-types';
import { useCalendarDates } from '@/hooks/useCalendarDates';
import { getFontFamilyWithFallback } from '@/config/fonts';
import { useCalendarStore } from '@/store/calendarStore';

interface CalendarGridProps {
  /** Grid configuration from the page */
  config: CalendarGridConfig;
  /** Month number (1-12) */
  month: number;
  /** Year */
  year: number;
  /** Locale for day/month names */
  locale: Locale;
  /** Global typography (can be overridden by config.typographyOverrides) */
  typography: DefaultTypography;
  /** Canvas scale factor */
  canvasScale: number;
}

function toCanvasPx(mm: number, scale: number): number {
  return mmToPx(mm, 300) * scale;
}

const CalendarGridComponent: React.FC<CalendarGridProps> = ({
  config,
  month,
  year,
  locale,
  typography,
  canvasScale,
}) => {
  const globalSettings = useCalendarStore((s) => s.project.globalSettings);

  // Merge typography overrides
  const typo = useMemo(() => ({
    monthHeader: { ...typography.monthHeader, ...config.typographyOverrides?.monthHeader },
    dayNames: { ...typography.dayNames, ...config.typographyOverrides?.dayNames },
    dayNumbers: { ...typography.dayNumbers, ...config.typographyOverrides?.dayNumbers },
  }), [typography, config.typographyOverrides]);

  // Calculate dates
  const calendarData = useCalendarDates(
    year,
    month,
    locale,
    config.startDayOfWeek,
    config.dayNamesFormat ?? (config.shortDayNames !== false ? 'short' : 'full')
  );

  // Grid dimensions in canvas pixels
  const gridX = toCanvasPx(config.positionMm.xMm, canvasScale);
  const gridY = toCanvasPx(config.positionMm.yMm, canvasScale);
  const gridW = toCanvasPx(config.positionMm.widthMm, canvasScale);
  const gridH = toCanvasPx(config.positionMm.heightMm, canvasScale);

  // Layout calculations
  const headerFontSize = typo.monthHeader.fontSizePt * canvasScale * 3.5;
  const dayNamesFontSize = typo.dayNames.fontSizePt * canvasScale * 3.5;
  const dayNumbersFontSize = typo.dayNumbers.fontSizePt * canvasScale * 3.5;

  const headerHeight = headerFontSize * 2;
  const dayNamesHeight = dayNamesFontSize * 2.5;
  const gridBodyY = gridY + headerHeight + dayNamesHeight;
  const gridBodyH = gridH - headerHeight - dayNamesHeight;

  const numCols = config.showWeekNumbers ? 8 : 7;
  const colWidth = gridW / numCols;
  const numRows = calendarData.weeks.length;
  const rowHeight = gridBodyH / numRows;

  // Annotation lookup
  const annotationMap = useMemo(() => {
    const map = new Map<number, DayAnnotation>();
    for (const a of config.annotations) {
      map.set(a.day, a);
    }
    return map;
  }, [config.annotations]);

  // Month name with text transform
  const monthText = (() => {
    const name = config.includeYear !== false ? `${calendarData.monthName} ${year}` : calendarData.monthName;
    switch (typo.monthHeader.textTransform) {
      case 'uppercase': return name.toUpperCase();
      case 'capitalize': return name.charAt(0).toUpperCase() + name.slice(1);
      default: return name;
    }
  })();

  return (
    <Group>
      {/* Month Header */}
      <Text
        x={gridX}
        y={gridY}
        width={gridW}
        height={headerHeight}
        text={monthText}
        fontFamily={getFontFamilyWithFallback(typo.monthHeader.fontFamily)}
        fontStyle={typo.monthHeader.fontWeight >= 700 ? 'bold' : typo.monthHeader.fontWeight >= 500 ? '500' : 'normal'}
        fontSize={headerFontSize}
        fill={typo.monthHeader.color}
        align={typo.monthHeader.textAlign ?? 'center'}
        verticalAlign="middle"
      />

      {/* Separator line */}
      <Line
        points={[gridX, gridY + headerHeight - 2, gridX + gridW, gridY + headerHeight - 2]}
        stroke={typo.dayNames.color}
        strokeWidth={0.5}
        opacity={0.3}
      />

      {/* Day Names Row */}
      {calendarData.dayNames.map((name, i) => {
        const colIdx = config.showWeekNumbers ? i + 1 : i;
        const dayText = typo.dayNames.textTransform === 'uppercase' ? name.toUpperCase() : name;
        return (
          <Text
            key={`dayname-${i}`}
            x={gridX + colIdx * colWidth}
            y={gridY + headerHeight}
            width={colWidth}
            height={dayNamesHeight}
            text={dayText}
            fontFamily={getFontFamilyWithFallback(typo.dayNames.fontFamily)}
            fontStyle={typo.dayNames.fontWeight >= 600 ? 'bold' : 'normal'}
            fontSize={dayNamesFontSize}
            fill={typo.dayNames.color}
            align="center"
            verticalAlign="middle"
          />
        );
      })}

      {/* Week number header if enabled */}
      {config.showWeekNumbers && (
        <Text
          x={gridX}
          y={gridY + headerHeight}
          width={colWidth}
          height={dayNamesHeight}
          text="#"
          fontFamily={typo.dayNames.fontFamily}
          fontSize={dayNamesFontSize * 0.85}
          fill={typo.dayNames.color}
          align="center"
          verticalAlign="middle"
          opacity={0.5}
        />
      )}

      {/* Day Cell Background Fills — Completely fills square if enabled */}
      <Group key="day-cell-backgrounds">
        {calendarData.weeks.map((week, rowIdx) =>
          week.map((day, colIdx) => {
            if (!day.isCurrentMonth) return null;
            const annotation = annotationMap.get(day.day);
            if (!annotation) return null;
            const isHoliday = !!annotation.isHoliday;
            const shouldFill = isHoliday
              ? (config.holidayFillBackground ?? globalSettings.holidayFillBackground ?? false)
              : (annotation.fillBackground ?? false);
            if (!shouldFill) return null;

            const bgColor = isHoliday
              ? (config.holidayBackgroundColor ?? globalSettings.holidayBackgroundColor ?? '#ffebee')
              : (annotation.backgroundColor ?? `${annotation.color}18`);

            const cellColIdx = config.showWeekNumbers ? colIdx + 1 : colIdx;
            const cellX = gridX + cellColIdx * colWidth;
            const cellY = gridBodyY + rowIdx * rowHeight;

            return (
              <Rect
                key={`bg-${rowIdx}-${colIdx}`}
                x={cellX}
                y={cellY}
                width={colWidth}
                height={rowHeight}
                fill={bgColor}
                cornerRadius={0}
                listening={false}
              />
            );
          }),
        )}
      </Group>

      {/* Grid lines */}
      {config.showGridLines !== false && (
        <Group>
          {Array.from({ length: numRows + 1 }).map((_, row) => (
            <Line
              key={`hline-${row}`}
              points={[gridX, gridBodyY + row * rowHeight, gridX + gridW, gridBodyY + row * rowHeight]}
              stroke={typo.dayNumbers.color}
              strokeWidth={1}
              opacity={0.4}
            />
          ))}
          {Array.from({ length: numCols + 1 }).map((_, col) => (
            <Line
              key={`vline-${col}`}
              points={[gridX + col * colWidth, gridBodyY, gridX + col * colWidth, gridBodyY + numRows * rowHeight]}
              stroke={typo.dayNumbers.color}
              strokeWidth={1}
              opacity={0.4}
            />
          ))}
        </Group>
      )}

      {/* Day Numbers & Annotation Texts */}
      {calendarData.weeks.map((week, rowIdx) =>
        week.map((day, colIdx) => {
          const cellColIdx = config.showWeekNumbers ? colIdx + 1 : colIdx;
          const cellX = gridX + cellColIdx * colWidth;
          const cellY = gridBodyY + rowIdx * rowHeight;
          const padding = (typo.dayNumbers.cellPaddingPx?.top ?? 4) * canvasScale;
          const annotation = day.isCurrentMonth ? annotationMap.get(day.day) : undefined;

          const isHoliday = !!annotation?.isHoliday;
          const holidayColor = annotation?.color ?? config.holidayColor ?? globalSettings.holidayColor ?? '#000000';

          let dayColor = typo.dayNumbers.color;
          if (isHoliday) {
            dayColor = holidayColor;
          } else if (day.isSunday) {
            dayColor = typo.dayNumbers.sundayColor;
          } else if (day.isSaturday && typo.dayNumbers.saturdayColor) {
            dayColor = typo.dayNumbers.saturdayColor;
          }
          if (!day.isCurrentMonth) dayColor = typo.dayNumbers.color + '30'; // 30 = ~18% opacity hex

          const textPos = isHoliday
            ? (config.holidayTextPosition ?? globalSettings.holidayTextPosition ?? 'bottom')
            : (annotation?.textPosition ?? 'bottom');

          const numH = dayNumbersFontSize * 1.35;
          const availW = colWidth - padding * 2;
          const numVAlign: VerticalAlign = typo.dayNumbers.verticalAlign ?? 'top';

          // Day numbers maintain strict, identical positioning across all cells (never displaced)
          let numY = cellY + padding;
          let annAreaTop = cellY + padding + numH + 2;
          let annH = Math.max(8, cellY + rowHeight - padding - annAreaTop);

          if (numVAlign === 'middle') {
            // Day number stays centered in the cell for all days (with or without notes)
            numY = cellY + Math.round((rowHeight - numH) / 2);
            // Text/notes are placed down in the space below the centered number
            annAreaTop = numY + numH + 1;
            annH = Math.max(8, cellY + rowHeight - padding - annAreaTop);
          } else if (numVAlign === 'bottom') {
            numY = cellY + rowHeight - padding - numH;
            annAreaTop = cellY + padding;
            annH = Math.max(8, numY - annAreaTop - 1);
          }

          const annY = annAreaTop;
          const annVAlign: 'top' | 'middle' | 'bottom' =
            textPos === 'top' ? 'top' : textPos === 'middle' ? 'middle' : 'bottom';

          return (
            <Group
              key={`day-${rowIdx}-${colIdx}`}
              onClick={() => {
                if (!day.isCurrentMonth) return;
                const store = useCalendarStore.getState();
                store.setSelectedDayForAnnotation(day.day);
                store.setActiveTab('notes');
              }}
              onTap={() => {
                if (!day.isCurrentMonth) return;
                const store = useCalendarStore.getState();
                store.setSelectedDayForAnnotation(day.day);
                store.setActiveTab('notes');
              }}
              onMouseEnter={(e) => {
                if (day.isCurrentMonth) {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'pointer';
                }
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'default';
              }}
            >
              {/* Day number */}
              <Text
                x={cellX + padding}
                y={numY}
                width={availW}
                height={numH}
                text={String(day.day)}
                fontFamily={getFontFamilyWithFallback(typo.dayNumbers.fontFamily)}
                fontStyle={typo.dayNumbers.fontWeight >= 600 ? 'bold' : 'normal'}
                fontSize={dayNumbersFontSize}
                fill={dayColor}
                align={typo.dayNumbers.textAlign ?? 'center'}
                verticalAlign="middle"
              />

              {/* Annotation / Holiday text */}
              {annotation && (
                <Text
                  x={cellX + padding}
                  y={annY}
                  width={availW}
                  height={annH}
                  text={
                    annotation.isHoliday
                      ? (annotation.text?.replace(/^🔴\s*/, '') || '')
                      : `${annotation.icon ? `${annotation.icon} ` : ''}${annotation.text?.replace(/^🔴\s*/, '') || ''}`.trim()
                  }
                  fontFamily={getFontFamilyWithFallback(annotation.fontFamily ?? typo.dayNumbers.fontFamily)}
                  fontSize={(annotation.fontSizePt ?? 7) * canvasScale * 3.5}
                  fill={isHoliday ? holidayColor : annotation.color}
                  align="center"
                  verticalAlign={annVAlign}
                  wrap="word"
                  ellipsis={true}
                  lineHeight={1.15}
                />
              )}
            </Group>
          );
        }),
      )}

      {/* Week numbers column */}
      {config.showWeekNumbers &&
        calendarData.weeks.map((week, rowIdx) => (
          <Text
            key={`weeknum-${rowIdx}`}
            x={gridX}
            y={gridBodyY + rowIdx * rowHeight}
            width={colWidth}
            height={rowHeight}
            text={String(week[0].weekNumber)}
            fontFamily={getFontFamilyWithFallback(typo.dayNumbers.fontFamily)}
            fontSize={dayNumbersFontSize * 0.75}
            fill={typo.dayNumbers.color}
            align="center"
            verticalAlign="middle"
            opacity={0.4}
          />
        ))}
    </Group>
  );
};

export default React.memo(CalendarGridComponent);
