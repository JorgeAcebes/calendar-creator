// =============================================================================
// OffsetControls — Arrow-based image positioning (No free drag!)
// =============================================================================

import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, ZoomIn, Trash2 } from 'lucide-react';
import type { ImageTransform } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface OffsetControlsProps {
  regionId: string;
  pageIndex: number;
  transform: ImageTransform;
  hasImage: boolean;
  clipToSafeArea?: boolean;
}

const OffsetControls: React.FC<OffsetControlsProps> = ({
  regionId,
  pageIndex,
  transform,
  hasImage,
  clipToSafeArea,
}) => {
  const updateTransform = useCalendarStore((s) => s.updateImageTransform);
  const setClipToSafe = useCalendarStore((s) => s.setRegionClipToSafe);
  const clearImage = useCalendarStore((s) => s.clearImageFromRegion);
  const stepMm = useCalendarStore((s) => s.editor.offsetStepMm);
  const setOffsetStep = useCalendarStore((s) => s.setOffsetStepMm);

  const move = (dx: number, dy: number) => {
    updateTransform(pageIndex, regionId, {
      offsetXMm: transform.offsetXMm + dx,
      offsetYMm: transform.offsetYMm + dy,
    });
  };

  const resetTransform = () => {
    updateTransform(pageIndex, regionId, {
      scale: 1,
      offsetXMm: 0,
      offsetYMm: 0,
    });
  };

  // Keyboard shortcuts
  useKeyboardShortcuts(
    hasImage
      ? {
          ArrowUp: () => move(0, -stepMm),
          ArrowDown: () => move(0, stepMm),
          ArrowLeft: () => move(-stepMm, 0),
          ArrowRight: () => move(stepMm, 0),
          Delete: () => clearImage(pageIndex, regionId),
        }
      : {},
  );

  if (!hasImage) {
    return (
      <div className="panel-section animate-fade-in">
        <div className="panel-section__header">
          <span className="panel-section__title">Imagen</span>
        </div>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
          Arrastra una foto desde el panel izquierdo a esta zona del lienzo.
        </p>
      </div>
    );
  }

  return (
    <div className="panel-section animate-fade-in">
      <div className="panel-section__header">
        <span className="panel-section__title">Posición de imagen</span>
        <button
          className="btn btn--ghost btn--sm btn--icon tooltip"
          data-tooltip="Eliminar imagen"
          onClick={() => clearImage(pageIndex, regionId)}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* D-Pad */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div className="dpad">
          <div />
          <button className="dpad__btn" onClick={() => move(0, -stepMm)} title="Mover arriba">
            <ArrowUp size={16} />
          </button>
          <div />
          <button className="dpad__btn" onClick={() => move(-stepMm, 0)} title="Mover izquierda">
            <ArrowLeft size={16} />
          </button>
          <button className="dpad__btn dpad__btn--center" onClick={resetTransform} title="Restablecer">
            <RotateCcw size={14} />
          </button>
          <button className="dpad__btn" onClick={() => move(stepMm, 0)} title="Mover derecha">
            <ArrowRight size={16} />
          </button>
          <div />
          <button className="dpad__btn" onClick={() => move(0, stepMm)} title="Mover abajo">
            <ArrowDown size={16} />
          </button>
          <div />
        </div>

        {/* Step size */}
        <div className="panel-section__row" style={{ width: '100%' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Paso (mm)</label>
            <select
              className="input select input--sm"
              value={stepMm}
              onChange={(e) => setOffsetStep(Number(e.target.value))}
            >
              <option value="0.5">0.5 mm</option>
              <option value="1">1 mm</option>
              <option value="2">2 mm</option>
              <option value="5">5 mm</option>
            </select>
          </div>
        </div>
      </div>

      {/* Numeric inputs */}
      <div className="panel-section__grid" style={{ marginTop: 'var(--space-4)' }}>
        <div className="input-group">
          <label className="input-label">Offset X (mm)</label>
          <input
            type="number"
            className="input input--sm input-numeric"
            value={Math.round(transform.offsetXMm * 10) / 10}
            step={0.5}
            onChange={(e) =>
              updateTransform(pageIndex, regionId, { offsetXMm: Number(e.target.value) })
            }
          />
        </div>
        <div className="input-group">
          <label className="input-label">Offset Y (mm)</label>
          <input
            type="number"
            className="input input--sm input-numeric"
            value={Math.round(transform.offsetYMm * 10) / 10}
            step={0.5}
            onChange={(e) =>
              updateTransform(pageIndex, regionId, { offsetYMm: Number(e.target.value) })
            }
          />
        </div>
      </div>

      {/* Scale slider */}
      <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
        <div className="panel-section__row panel-section__row--between">
          <label className="input-label">
            <ZoomIn size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Escala
          </label>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(transform.scale * 100)}%
          </span>
        </div>
        <input
          type="range"
          className="slider"
          min={0.5}
          max={3}
          step={0.05}
          value={transform.scale}
          onChange={(e) =>
            updateTransform(pageIndex, regionId, { scale: Number(e.target.value) })
          }
        />
      </div>

      {/* Clip to Safe Area Toggle */}
      <div className="input-group" style={{ marginTop: 'var(--space-4)', flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
        <input
          type="checkbox"
          id={`clip-${regionId}`}
          checked={!!clipToSafeArea}
          onChange={(e) => setClipToSafe(pageIndex, regionId, e.target.checked)}
          style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
        />
        <label htmlFor={`clip-${regionId}`} className="input-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
          Limitar foto a la zona segura
        </label>
      </div>
    </div>
  );
};

export default OffsetControls;
