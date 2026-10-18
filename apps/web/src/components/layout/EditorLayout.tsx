// =============================================================================
// EditorLayout — Main editor shell with sidebar, canvas, and intuitive panel
// =============================================================================

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Layout, Type, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import Toolbar from './Toolbar';
import CalendarCanvas from '@/components/canvas/CalendarCanvas';
import PhotoPanel from '@/components/panels/PhotoPanel';
import PageNavigator from '@/components/panels/PageNavigator';
import LayoutSelector from '@/components/panels/LayoutSelector';
import TypographyPanel from '@/components/panels/TypographyPanel';
import AnnotationPanel from '@/components/panels/AnnotationPanel';
import OffsetControls from '@/components/controls/OffsetControls';
import CoverTextPanel from '@/components/panels/CoverTextPanel';
import { useCalendarStore } from '@/store/calendarStore';
import { loadProjectData, saveProjectData } from '@/utils/projectStorage';
import type { CalendarProject } from '@calendar-creator/shared-types';

type RightPanelTab = 'design' | 'typography' | 'notes';

const EditorLayout: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const activePageIndex = useCalendarStore((s) => s.editor.activePageIndex);
  const selectedRegionId = useCalendarStore((s) => s.editor.selectedRegionId);
  const activePage = useCalendarStore((s) => s.project.pages[s.editor.activePageIndex]);
  const project = useCalendarStore((s) => s.project);
  const loadProject = useCalendarStore((s) => s.loadProject);
  const setActivePage = useCalendarStore((s) => s.setActivePage);
  const setCanvasZoom = useCalendarStore((s) => s.setCanvasZoom);
  
  const [loading, setLoading] = useState(id !== 'new');
  const [sidebarWidth, setSidebarWidth] = useState(280); // resizable left sidebar
  const [panelWidth, setPanelWidth] = useState(330); // resizable right panel
  const [activeTab, setActiveTab] = useState<RightPanelTab>('design');
  const hasAutoFittedRef = useRef(false);

  // Load project from storage (Tauri AppData or IndexedDB/localStorage in browser)
  useEffect(() => {
    if (id && id !== 'new') {
      loadProjectData(id)
        .then((parsedData) => {
          if (parsedData) {
            loadProject(parsedData);
            setLoading(false);
          } else {
            alert('Proyecto no encontrado.');
            navigate('/');
          }
        })
        .catch((err) => {
          console.error('Error loading project', err);
          alert('Error al cargar el proyecto.');
          navigate('/');
        });
    } else {
      setLoading(false);
    }
  }, [id, loadProject, navigate]);

  // Auto-fit initial zoom to screen on initial mount/project load (3.1)
  useEffect(() => {
    if (loading || hasAutoFittedRef.current) return;
    hasAutoFittedRef.current = true;

    const calculateAutoFit = () => {
      const availW = Math.max(320, window.innerWidth - sidebarWidth - panelWidth - 64);
      const availH = Math.max(320, window.innerHeight - 52 - 96 - 64);
      const paper = project.globalSettings.paperDimensions;
      const bleed = project.globalSettings.bleed;
      const dpi = 300;
      const totalW = ((paper.widthMm + bleed.leftMm + bleed.rightMm) / 25.4) * dpi;
      const totalH = ((paper.heightMm + bleed.topMm + bleed.bottomMm) / 25.4) * dpi;
      const zoom = Math.min(availW / totalW, availH / totalH);
      setCanvasZoom(Math.max(0.12, Math.min(zoom, 1.2)));
    };

    // Defer slightly to ensure layout container widths are calculated
    const timer = setTimeout(calculateAutoFit, 100);
    return () => clearTimeout(timer);
  }, [loading, sidebarWidth, panelWidth, project.globalSettings, setCanvasZoom]);

  // When user selects an image region on the canvas, switch right sidebar to 'design' tab
  useEffect(() => {
    if (selectedRegionId) {
      setActiveTab('design');
    }
  }, [selectedRegionId]);

  // Save project to storage
  const saveProject = (proj: CalendarProject) => {
    if (!proj.id || loading || id === 'new') return;
    saveProjectData(proj).catch(console.error);
  };

  // Auto-save logic (debounced)
  useEffect(() => {
    if (loading || !project.id || id === 'new') return;
    const timeoutId = setTimeout(() => {
      saveProjectData(project).catch(console.error);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [project, loading, id]);

  // Force save on unmount or window close
  useEffect(() => {
    const handleBeforeUnload = () => saveProject(project);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveProject(project);
    };
  }, [project, loading, id]);

  // Left sidebar resizing logic (3.4)
  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(220, Math.min(startWidth + deltaX, 550));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Right panel resizing logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.max(280, Math.min(startWidth + deltaX, 600));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Find the selected region
  const selectedRegion = selectedRegionId
    ? activePage?.imageRegions.find((r: any) => r.id === selectedRegionId)
    : null;

  if (loading) {
    return <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)', color: '#fff', fontFamily: 'var(--font-ui)' }}>Cargando proyecto...</div>;
  }

  return (
    <div
      className="editor-layout"
      style={{
        '--sidebar-width': `${sidebarWidth}px`,
        '--panel-width': `${panelWidth}px`,
      } as React.CSSProperties}
    >
      {/* Top bar */}
      <div className="editor-layout__toolbar">
        <Toolbar />
      </div>

      {/* Left sidebar — Photos (resizable) */}
      <div className="editor-layout__sidebar" style={{ position: 'relative' }}>
        <PhotoPanel />
        {/* Left Resizer Handle */}
        <div 
          style={{
            position: 'absolute',
            right: -3,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: 'col-resize',
            zIndex: 50,
            background: 'transparent'
          }}
          onMouseDown={handleSidebarMouseDown}
          title="Arrastra para redimensionar el panel de fotos"
        />
      </div>

      {/* Center — Canvas */}
      <div
        className="editor-layout__canvas"
        style={{ position: 'relative' }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
      >
        {activePageIndex > 0 && (
          <button
            className="btn btn--icon glass-panel"
            onClick={() => setActivePage(activePageIndex - 1)}
            style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 48, height: 48, borderRadius: '50%' }}
            title="Página anterior"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <CalendarCanvas />
        {activePageIndex < project.pages.length - 1 && (
          <button
            className="btn btn--icon glass-panel"
            onClick={() => setActivePage(activePageIndex + 1)}
            style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 48, height: 48, borderRadius: '50%' }}
            title="Página siguiente"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom — Page navigator */}
      <div className="editor-layout__page-nav">
        <PageNavigator />
      </div>

      {/* Right panel — Intuitive Tabbed Config Panel */}
      <div className="editor-layout__panel" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* Resizer Handle */}
        <div 
          style={{
            position: 'absolute',
            left: -3,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: 'col-resize',
            zIndex: 50,
            background: 'transparent'
          }}
          onMouseDown={handleMouseDown}
          title="Arrastra para redimensionar el panel de ajustes"
        />

        {/* Tab Navigation Bar */}
        <div
          style={{
            display: 'flex',
            background: 'var(--color-bg-secondary)',
            borderBottom: '1px solid var(--color-glass-border)',
            padding: '8px',
            gap: '6px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <button
            className={`btn btn--sm ${activeTab === 'design' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ flex: 1, padding: '6px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => setActiveTab('design')}
            title="Maquetación y encuadre de fotos"
          >
            <Layout size={14} />
            <span>Diseño</span>
            {selectedRegion && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#2ed573',
                  display: 'inline-block',
                }}
                title="Foto seleccionada"
              />
            )}
          </button>
          <button
            className={`btn btn--sm ${activeTab === 'typography' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ flex: 1, padding: '6px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => setActiveTab('typography')}
            title="Tipografía de títulos y números"
          >
            <Type size={14} />
            <span>Tipografía</span>
          </button>
          <button
            className={`btn btn--sm ${activeTab === 'notes' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ flex: 1, padding: '6px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => setActiveTab('notes')}
            title={activePage?.type === 'cover' ? 'Textos de la portada' : 'Notas y festivos del mes'}
          >
            <FileText size={14} />
            <span>{activePage?.type === 'cover' ? 'Textos' : 'Notas'}</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* TAB 1: DISEÑO & FOTO */}
          {activeTab === 'design' && (
            <div className="animate-fade-in">
              {/* Highlighted contextual photo editor when an image slot is selected */}
              {selectedRegion ? (
                <div style={{ borderBottom: '1px solid var(--color-glass-border)', paddingBottom: 'var(--space-2)' }}>
                  <div style={{
                    padding: '8px 16px',
                    background: 'rgba(10, 132, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(10, 132, 255, 0.15)',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0a84ff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ImageIcon size={14} />
                      {selectedRegion.imageFileId ? 'Foto seleccionada' : 'Hueco de foto seleccionado'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                      {activePage?.type === 'cover' ? 'Portada' : `Mes ${activePage?.month ?? ''}`}
                    </span>
                  </div>
                  <OffsetControls
                    regionId={selectedRegion.id}
                    pageIndex={activePageIndex}
                    transform={selectedRegion.transform}
                    hasImage={!!selectedRegion.imageFileId}
                    clipToSafeArea={selectedRegion.clipToSafeArea}
                  />
                </div>
              ) : (
                <div style={{
                  padding: '12px 16px',
                  margin: '12px 16px',
                  background: 'var(--color-bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-glass-border)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}>
                  <Sparkles size={16} color="var(--color-accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    Haz clic en cualquier ranura o foto del calendario para ajustar su encuadre, zoom o sustituirla.
                  </p>
                </div>
              )}

              {/* Layout template selection */}
              <LayoutSelector />
            </div>
          )}

          {/* TAB 2: TIPOGRAFÍA */}
          {activeTab === 'typography' && (
            <div className="animate-fade-in">
              <TypographyPanel />
            </div>
          )}

          {/* TAB 3: NOTAS & TEXTOS */}
          {activeTab === 'notes' && (
            <div className="animate-fade-in">
              {activePage?.type === 'cover' ? (
                <CoverTextPanel />
              ) : (
                <AnnotationPanel />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
