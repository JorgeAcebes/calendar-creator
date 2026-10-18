// =============================================================================
// OffsetControls — Arrow-based image positioning (No free drag!)
// =============================================================================

import React, { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, ZoomIn, ZoomOut, Trash2, Shield, Move } from 'lucide-react';
import type { ImageTransform } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { showToast } from '@/components/layout/Toast';

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
  const setGlobalClipToSafe = useCalendarStore((s) => s.setGlobalClipToSafe);
  const clearImage = useCalendarStore((s) => s.clearImageFromRegion);
  const stepMm = useCalendarStore((s) => s.editor.offsetStepMm);
  const setOffsetStep = useCalendarStore((s) => s.setOffsetStepMm);
  const [applyGlobally, setApplyGlobally] = useState(true);

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

  const changeScale = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(3, Math.round((transform.scale + delta) * 100) / 100));
    updateTransform(pageIndex, regionId, { scale: newScale });
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
      <div className="panel-section animate-fade-in" style={{ padding: '14px 16px' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px dashed var(--color-glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
            🖼️ <strong>Hueco seleccionado</strong><br />
            Arrastra una foto desde la galería lateral para colocarla aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-section animate-fade-in" style={{ padding: '16px' }}>
      {/* Section Header with Quick Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Move size={13} color="#0a84ff" />
          Ajuste de encuadre
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn--ghost btn--sm"
            style={{ fontSize: '11px', padding: '3px 8px', height: 'auto', borderRadius: '6px' }}
            onClick={resetTransform}
            title="Centrar y volver a 100%"
          >
            <RotateCcw size={11} style={{ marginRight: 4 }} />
            Centrar
          </button>
          <button
            className="btn btn--ghost btn--sm"
            style={{ fontSize: '11px', color: '#ff453a', padding: '3px 8px', height: 'auto', borderRadius: '6px' }}
            onClick={() => clearImage(pageIndex, regionId)}
            title="Quitar foto de esta ranura"
          >
            <Trash2 size={11} style={{ marginRight: 4 }} />
            Quitar
          </button>
        </div>
      </div>

      {/* D-Pad & Precision Card */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.22)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '14px',
      }}>
        {/* D-Pad */}
        <div className="dpad" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }}>
          <div />
          <button className="dpad__btn" onClick={() => move(0, -stepMm)} title="Mover arriba">
            <ArrowUp size={15} />
          </button>
          <div />
          <button className="dpad__btn" onClick={() => move(-stepMm, 0)} title="Mover izquierda">
            <ArrowLeft size={15} />
          </button>
          <button className="dpad__btn dpad__btn--center" onClick={resetTransform} title="Centrar encuadre">
            <RotateCcw size={13} />
          </button>
          <button className="dpad__btn" onClick={() => move(stepMm, 0)} title="Mover derecha">
            <ArrowRight size={15} />
          </button>
          <div />
          <button className="dpad__btn" onClick={() => move(0, stepMm)} title="Mover abajo">
            <ArrowDown size={15} />
          </button>
          <div />
        </div>

        {/* Step chips selector */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
            Paso:
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0.5, 1, 2, 5].map((val) => {
              const isSelected = stepMm === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setOffsetStep(val)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: 6,
                    border: isSelected ? '1px solid #0a84ff' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? 'rgba(10, 132, 255, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? '#0a84ff' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {val} mm
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Numeric inputs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: '14px',
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Offset X</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="number"
              className="input input--sm input-numeric"
              style={{ width: '100%', height: '26px', fontSize: '12px' }}
              value={Math.round(transform.offsetXMm * 10) / 10}
              step={0.5}
              onChange={(e) =>
                updateTransform(pageIndex, regionId, { offsetXMm: Number(e.target.value) })
              }
            />
            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>mm</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Offset Y</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="number"
              className="input input--sm input-numeric"
              style={{ width: '100%', height: '26px', fontSize: '12px' }}
              value={Math.round(transform.offsetYMm * 10) / 10}
              step={0.5}
              onChange={(e) =>
                updateTransform(pageIndex, regionId, { offsetYMm: Number(e.target.value) })
              }
            />
            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>mm</span>
          </div>
        </div>
      </div>

      {/* Scale Slider Card */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.18)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ZoomIn size={13} color="#0a84ff" />
            Zoom de imagen
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: '11px',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 700,
              color: '#0a84ff',
              background: 'rgba(10, 132, 255, 0.12)',
              padding: '1px 6px',
              borderRadius: '4px',
            }}>
              {Math.round(transform.scale * 100)}%
            </span>
            {transform.scale !== 1 && (
              <button
                type="button"
                onClick={() => updateTransform(pageIndex, regionId, { scale: 1 })}
                style={{
                  fontSize: '9px',
                  color: 'var(--color-text-tertiary)',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                title="Restablecer zoom al 100%"
              >
                100%
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => changeScale(-0.05)}
            className="btn btn--ghost btn--sm"
            style={{ padding: '2px 6px', height: '24px' }}
            title="Reducir zoom (-5%)"
          >
            <ZoomOut size={12} />
          </button>
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
            style={{ flex: 1, accentColor: '#0a84ff', cursor: 'pointer' }}
          />
          <button
            type="button"
            onClick={() => changeScale(0.05)}
            className="btn btn--ghost btn--sm"
            style={{ padding: '2px 6px', height: '24px' }}
            title="Aumentar zoom (+5%)"
          >
            <ZoomIn size={12} />
          </button>
        </div>
      </div>

      {/* Clip to Safe Area Card */}
      <div style={{
        background: 'rgba(255, 214, 10, 0.05)',
        border: '1px solid rgba(255, 214, 10, 0.2)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffd60a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={13} />
            Zona de seguridad
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '10px', cursor: 'pointer', color: applyGlobally ? '#ffd60a' : 'var(--color-text-tertiary)', fontWeight: applyGlobally ? 600 : 400 }}>
            <input
              type="checkbox"
              checked={applyGlobally}
              onChange={(e) => setApplyGlobally(e.target.checked)}
              style={{ width: 12, height: 12, accentColor: '#ffd60a', cursor: 'pointer' }}
            />
            <span>Aplicar a todo</span>
          </label>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '11px', cursor: 'pointer', color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
          <input
            type="checkbox"
            id={`clip-${regionId}`}
            checked={!!clipToSafeArea}
            onChange={(e) => {
              setGlobalClipToSafe(e.target.checked, applyGlobally, pageIndex, regionId);
              showToast({
                type: 'info',
                message: applyGlobally
                  ? (e.target.checked ? 'Todas las fotos limitadas a la zona segura' : 'Límite de zona segura desactivado en todo el calendario')
                  : (e.target.checked ? 'Foto limitada a la zona segura' : 'Límite de zona segura desactivado en esta foto'),
              });
            }}
            style={{ width: 14, height: 14, marginTop: 2, accentColor: '#ffd60a', cursor: 'pointer' }}
          />
          <span>Limitar foto a la zona segura (5mm del corte)</span>
        </label>
      </div>
    </div>
  );
};

export default OffsetControls;
