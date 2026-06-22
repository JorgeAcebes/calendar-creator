// =============================================================================
// PhotoPanel — Image upload & gallery sidebar (flat, no folders)
// =============================================================================

import React, { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Trash2, Upload, AlertTriangle, Heart, CheckCircle2, CheckSquare, X, CheckCheck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import type { UploadedImage } from '@calendar-creator/shared-types';
import { useCalendarStore } from '@/store/calendarStore';
import { showToast } from '@/components/layout/Toast';

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
  const addImage = useCalendarStore((s) => s.addImage);
  const removeImage = useCalendarStore((s) => s.removeImage);
  const assignImage = useCalendarStore((s) => s.assignImageToRegion);
  const setWarnOnDuplicatePhotos = useCalendarStore((s) => s.setWarnOnDuplicatePhotos);
  const activePageIndex = useCalendarStore((s) => s.editor.activePageIndex);
  const activePage = pages[activePageIndex];
  const selectedRegionId = useCalendarStore((s) => s.editor.selectedRegionId);

  const processFiles = useCallback(async (filesData: { name: string, size: number, type: string, arrayBuffer: () => Promise<ArrayBuffer> }[]) => {
    const currentImages = Object.values(useCalendarStore.getState().project.images);
    const warnOnDuplicate = useCalendarStore.getState().project.globalSettings.warnOnDuplicatePhotos !== false;

    const duplicates: typeof filesData = [];
    const newFiles: typeof filesData = [];

    for (const file of filesData) {
      if (warnOnDuplicate) {
        const existsInStore = currentImages.some((img: any) => img.originalFilename === file.name && img.fileSizeBytes === file.size);
        const existsInBatch = newFiles.some(f => f.name === file.name && f.size === file.size) || duplicates.some(f => f.name === file.name && f.size === file.size);
        
        if (existsInStore || existsInBatch) {
          if (!duplicates.some(f => f.name === file.name && f.size === file.size)) {
             duplicates.push(file);
          }
          continue;
        }
      }
      newFiles.push(file);
    }

    const filesToUpload = [...newFiles];

    if (duplicates.length > 0) {
      const dupNames = duplicates.map(d => d.name).join(', ');
      const msg = duplicates.length === 1 
        ? `La foto "${duplicates[0].name}" ya ha sido subida. ¿Deseas volver a subirla?`
        : `${duplicates.length} fotos ya han sido subidas previamente (${dupNames}). ¿Deseas volver a subirlas?`;

      // Show toast warning and also show confirm dialog
      showToast({
        type: 'warning',
        message: duplicates.length === 1
          ? `Foto duplicada detectada: "${duplicates[0].name}"`
          : `${duplicates.length} fotos duplicadas detectadas`,
        duration: 3000,
      });
        
      if (window.confirm(msg)) {
        filesToUpload.push(...duplicates);
      }
    }

    for (const file of filesToUpload) {
      try {
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type });
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const imageData: UploadedImage = {
              id: uuidv4(),
              originalFilename: file.name,
              storagePath: '',
              thumbnailPath: '',
              previewDataUrl: reader.result as string,
              widthPx: img.naturalWidth,
              heightPx: img.naturalHeight,
              fileSizeBytes: file.size,
              mimeType: file.type as UploadedImage['mimeType'],
              folder: 'Sin clasificar',
            };
            addImage(imageData);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(blob);
      } catch(err) {
        console.error("Error processing file", err);
      }
    }
  }, [addImage]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      processFiles(acceptedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        arrayBuffer: () => f.arrayBuffer()
      })));
    },
    [processFiles],
  );

  useEffect(() => {
    if ((window as any).__TAURI_INTERNALS__) {
      import('@tauri-apps/api/webviewWindow').then(({ getCurrentWebviewWindow }) => {
        const unlistenPromise = getCurrentWebviewWindow().onDragDropEvent(async (event) => {
          if (event.payload.type === 'drop') {
            const paths = event.payload.paths;
            const { readFile } = await import('@tauri-apps/plugin-fs');
            
            const filesData = [];
            for (const path of paths) {
              const name = path.split(/[\/\\]/).pop() || 'image';
              const ext = name.split('.').pop()?.toLowerCase();
              if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) continue;
              
              let type = 'image/jpeg';
              if (ext === 'png') type = 'image/png';
              if (ext === 'webp') type = 'image/webp';
              
              try {
                const bytes = await readFile(path);
                filesData.push({
                  name,
                  size: bytes.length,
                  type,
                  arrayBuffer: async () => bytes.buffer as ArrayBuffer
                });
              } catch(err) {
                console.error("Failed to read dropped file", err);
              }
            }
            if (filesData.length > 0) {
              processFiles(filesData);
            }
          }
        });
        
        return () => {
          unlistenPromise.then(unlisten => unlisten());
        };
      });
    }
  }, [processFiles]);

  // In Tauri, disable react-dropzone drag to prevent double-processing with onDragDropEvent
  const isTauri = !!(window as any).__TAURI_INTERNALS__;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
    noDrag: isTauri,
  });

  const imageList = Object.values(images) as any[];

  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);
  const [pendingImageId, setPendingImageId] = React.useState<string | null>(null);
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedImageIds, setSelectedImageIds] = React.useState<Set<string>>(new Set());

  const handleThumbnailClick = (e: React.MouseEvent, imageId: string) => {
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
    let idsToDrag = [imageId];
    if (selectedImageIds.has(imageId)) {
      idsToDrag = Array.from(selectedImageIds);
    }
    setDraggedImageIds(idsToDrag);
    e.dataTransfer.setData('text/plain', idsToDrag.join(','));
    e.dataTransfer.setData('application/json', JSON.stringify(idsToDrag));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    // IMPORTANT: Do NOT assign images here. The drop handler in CalendarCanvas
    // (handleOverlayDrop) is responsible for assignment. This handler only
    // cleans up the drag state. Previously, both handleDragEnd AND
    // handleOverlayDrop were assigning, causing double-assignment bugs.
    setDraggedImageIds(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
