// =============================================================================
// PhotoPanel — Image upload & gallery sidebar (flat, no folders)
// =============================================================================

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Trash2, Upload, AlertTriangle, Heart, CheckCircle2, CheckSquare, X, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCalendarStore } from '@/store/calendarStore';
import { showToast } from '@/components/layout/Toast';
import { uploadFiles, type FileData } from '@/utils/uploadHelpers';

// ---------------------------------------------------------------------------
// Helper: find ALL pages where an image is used
// ---------------------------------------------------------------------------

function findAllImageUsages(imageId: string, pages: any[]): string[] {
  const usages: string[] = [];
  for (const page of pages) {
    if (page.imageRegions.some((r: any) => r.imageFileId === imageId)) {
      if (page.type === 'cover') {
        usages.push('Portada');
      } else {
        usages.push(page.month ? `Mes ${page.month}` : `Página ${page.index}`);
      }
    }
  }
  return usages;
}

const PhotoPanel: React.FC = () => {
  const navigate = useNavigate();
  const project = useCalendarStore((s) => s.project);
  const images = project.images;
  const pages = project.pages;
  const removeImage = useCalendarStore((s) => s.removeImage);
  const assignImage = useCalendarStore((s) => s.assignImageToRegion);
  const setWarnOnDuplicatePhotos = useCalendarStore((s) => s.setWarnOnDuplicatePhotos);
  const activePageIndex = useCalendarStore((s) => s.editor.activePageIndex);
  const activePage = pages[activePageIndex];
  const selectedRegionId = useCalendarStore((s) => s.editor.selectedRegionId);

  const [duplicateUploadPrompt, setDuplicateUploadPrompt] = React.useState<{
    duplicates: FileData[];
    newFiles: FileData[];
    resolve: (uploadDuplicates: boolean) => void;
  } | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const filesData = acceptedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        arrayBuffer: () => f.arrayBuffer()
      }));

      await uploadFiles(filesData, (duplicates, newFiles) => {
        return new Promise<boolean>((resolve) => {
          setDuplicateUploadPrompt({ duplicates, newFiles, resolve });
        });
      }).finally(() => {
        setDuplicateUploadPrompt(null);
      });
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
    noDrag: false,
  });

  const imageList = Object.values(images) as any[];

  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);
  const [pendingImageId, setPendingImageId] = React.useState<string | null>(null);
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedImageIds, setSelectedImageIds] = React.useState<Set<string>>(new Set());
  const [draggedImageId, setDraggedImageId] = React.useState<string | null>(null);

  const handleThumbnailClick = (e: React.MouseEvent, imageId: string) => {
    // Si estamos arrastrando, no hacer nada
    if (draggedImageId) return;

    if (selectionMode || e.ctrlKey || e.metaKey) {
      if (!selectionMode && !selectedImageIds.has(imageId)) {
        setSelectionMode(true);
      }
      const next = new Set(selectedImageIds);
      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);
      setSelectedImageIds(next);
      return;
    }

    if (!selectedRegionId || !activePage) return;

    const usages = findAllImageUsages(imageId, pages);
    if (usages.length > 0 && pendingImageId !== imageId && project.globalSettings.warnOnDuplicatePhotos) {
      // First click on a used image: warn
      const usageStr = usages.join(', ');
      setDuplicateWarning(`⚠ Esta foto ya está en uso (${usageStr}). Haz clic de nuevo para confirmar.`);
      setPendingImageId(imageId);

      showToast({
        type: 'warning',
        message: `Esta foto ya está asignada en: ${usageStr}`,
        duration: 4000,
      });

      setTimeout(() => { setDuplicateWarning(null); setPendingImageId(null); }, 4000);
      return;
    }

    // Either not used, or confirmed (second click)
    assignImage(activePageIndex, selectedRegionId, imageId);
    setDuplicateWarning(null);
    setPendingImageId(null);
  };

  const setDraggedImageIds = useCalendarStore((s) => s.setDraggedImageIds);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, imageId: string) => {
    setDraggedImageId(imageId);
    let idsToDrag = [imageId];
    if (selectedImageIds.has(imageId)) {
      idsToDrag = Array.from(selectedImageIds);
    }
    setDraggedImageIds(idsToDrag);
    e.dataTransfer.setData('text/plain', idsToDrag.join(','));
    e.dataTransfer.setData('application/json', JSON.stringify(idsToDrag));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Configurar imagen fantasma (ghost) transparente
    const ghostImg = new Image();
    ghostImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // transparent pixel
    e.dataTransfer.setDragImage(ghostImg, 0, 0);
  };

  const handleDragEnd = () => {
    setDraggedImageId(null);
    setDraggedImageIds(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {duplicateUploadPrompt && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', width: 400,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--color-warning)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Fotos Duplicadas Detectadas</h3>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.5 }}>
              Has intentado subir {duplicateUploadPrompt.duplicates.length} foto{duplicateUploadPrompt.duplicates.length > 1 ? 's' : ''} que ya existe{duplicateUploadPrompt.duplicates.length > 1 ? 'n' : ''}.
            </p>
            <div style={{ maxHeight: 100, overflowY: 'auto', background: 'var(--color-bg-primary)', padding: '8px', borderRadius: '4px', marginBottom: '24px' }}>
              {duplicateUploadPrompt.duplicates.map(d => (
                <div key={d.name} style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>
                  • {d.name} ({(d.size / 1024 / 1024).toFixed(1)} MB)
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn--ghost" 
                onClick={() => duplicateUploadPrompt.resolve(false)}
              >
                Omitir duplicados
              </button>
              <button 
                className="btn btn--primary" 
                onClick={() => duplicateUploadPrompt.resolve(true)}
              >
                Subir de todos modos
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="panel-section" style={{ paddingBottom: 0, borderBottom: 'none' }}>
        <button 
          className="btn" 
          style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-secondary), #ff6b81)', borderColor: 'transparent', color: '#fff', fontWeight: 600 }}
          onClick={() => navigate('/donate')}
        >
          <Heart size={14} fill="currentColor" />
          Donar
        </button>
      </div>

      <div className="panel-section">
        <div className="panel-section__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="panel-section__title">Fotos</span>
            <span className="badge">{imageList.length}</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {selectionMode && (
              <button 
                className="btn btn--ghost btn--icon"
                style={{ width: 28, height: 28, padding: 0 }}
                onClick={() => {
                  if (selectedImageIds.size === imageList.length) {
                    setSelectedImageIds(new Set());
                  } else {
                    setSelectedImageIds(new Set(imageList.map(img => img.id)));
                  }
                }}
                title={selectedImageIds.size === imageList.length ? "Deseleccionar todas" : "Seleccionar todas"}
              >
                <CheckCheck size={16} style={{ opacity: selectedImageIds.size === imageList.length ? 1 : 0.5 }} />
              </button>
            )}
            <button 
              className={`btn btn--icon ${selectionMode ? 'btn--primary' : 'btn--ghost'}`}
              style={{ width: 28, height: 28, padding: 0 }}
              onClick={() => { setSelectionMode(!selectionMode); setSelectedImageIds(new Set()); }}
              title="Selección múltiple"
            >
              <CheckSquare size={16} />
            </button>
          </div>
        </div>

        {/* Upload dropzone */}
        <div
          {...getRootProps()}
          className={`upload-dropzone ${isDragActive ? 'upload-dropzone--active' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="upload-dropzone__icon" size={28} />
          <div className="upload-dropzone__text">
            {isDragActive ? (
              <strong>Suelta las fotos aquí</strong>
            ) : (
              <>
                <strong>Arrastra fotos</strong> o haz clic para seleccionar
                <br />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  JPG, PNG, WebP • Se recomienda 300 DPI
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Settings section */}
      <div className="panel-section">
        <label className="checkbox-label" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          <input 
            type="checkbox" 
            className="checkbox"
            checked={project.globalSettings.warnOnDuplicatePhotos !== false}
            onChange={(e) => setWarnOnDuplicatePhotos(e.target.checked)}
          />
          Avisar si repito una foto
        </label>
      </div>

      {/* Bulk actions */}
      {selectionMode && selectedImageIds.size > 0 && (
        <div style={{ padding: '0 var(--space-4) var(--space-3)' }}>
          <button 
            className="btn" 
            style={{ width: '100%', background: 'var(--color-danger)', color: '#fff', borderColor: 'transparent' }}
            onClick={() => {
              selectedImageIds.forEach(id => removeImage(id));
              setSelectedImageIds(new Set());
              setSelectionMode(false);
            }}
          >
            <Trash2 size={14} /> Eliminar {selectedImageIds.size} foto{selectedImageIds.size > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Image gallery */}
      {imageList.length > 0 && (
        <div className="panel-section" style={{ flex: 1, overflowY: 'auto' }}>
          {selectedRegionId && (
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-accent)',
              marginBottom: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <AlertTriangle size={12} />
              Haz clic o arrastra a la zona seleccionada
            </p>
          )}
          {/* Duplicate image warning */}
          {duplicateWarning && (
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-warning)',
              background: 'var(--color-warning-soft)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-3)',
            }}>
              {duplicateWarning}
            </p>
          )}
          <div className="thumbnail-grid stagger-children">
            {imageList.map((img) => {
              const isLowRes = img.widthPx < 1200 && img.heightPx < 1200;
              const usages = findAllImageUsages(img.id, pages);
              const used = usages.length > 0;
              const isSelected = selectedImageIds.has(img.id);
              const usageStr = usages.join(', ');

              return (
                <div
                  key={img.id}
                  className={`thumbnail animate-scale-in ${isLowRes ? 'thumbnail--low-dpi' : ''} ${isSelected ? 'thumbnail--selected' : ''}`}
                  onClick={(e) => handleThumbnailClick(e, img.id)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, img.id)}
                  onDragEnd={handleDragEnd}
                  title={`${img.originalFilename}\n${img.widthPx}×${img.heightPx}px\n${(img.fileSizeBytes / 1024 / 1024).toFixed(1)} MB${used ? `\n\n📌 En uso: ${usageStr}` : ''}`}
                  style={isSelected ? { outline: '3px solid var(--color-primary)' } : {}}
                >
                  <img
                    src={img.previewDataUrl ?? img.thumbnailPath}
                    alt={img.originalFilename}
                    draggable={false}
                  />
                  {used && !isSelected && (
                    <div style={{ 
                      position: 'absolute', top: 4, left: 4, 
                      background: '#12121a', borderRadius: 10, 
                      padding: '1px 6px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      display: 'flex', alignItems: 'center', gap: 3,
                      fontSize: 10, color: '#2ed573', fontWeight: 600,
                    }}>
                      <CheckCircle2 size={11} color="#2ed573" />
                      {usages.length > 1 ? `×${usages.length}` : ''}
                    </div>
                  )}
                  {isSelected && (
                    <div style={{ position: 'absolute', top: 4, left: 4, background: 'var(--color-primary)', borderRadius: '50%', padding: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      <CheckSquare size={14} color="#fff" />
                    </div>
                  )}
                  {isLowRes && (
                    <span className="badge badge--warning" style={{
                      position: 'absolute',
                      bottom: 3,
                      left: 3,
                      fontSize: '8px',
                      padding: '1px 4px',
                    }}>
                      BAJA RES
                    </span>
                  )}
                  <button
                    className="btn btn--ghost btn--icon"
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 20,
                      height: 20,
                      minWidth: 'unset',
                      background: 'rgba(0,0,0,0.5)',
                      border: 'none',
                      borderRadius: '50%',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    title="Eliminar foto"
                  >
                    <X size={10} color="#fff" />
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

export default PhotoPanel;
