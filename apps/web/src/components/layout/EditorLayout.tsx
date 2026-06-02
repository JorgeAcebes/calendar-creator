// =============================================================================
// EditorLayout — Main editor shell with sidebar, canvas, and panel
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import type { CalendarProject } from '@calendar-creator/shared-types';

const EditorLayout: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const activePageIndex = useCalendarStore((s) => s.editor.activePageIndex);
  const selectedRegionId = useCalendarStore((s) => s.editor.selectedRegionId);
  const activePage = useCalendarStore((s) => s.project.pages[s.editor.activePageIndex]);
  const project = useCalendarStore((s) => s.project);
  const loadProject = useCalendarStore((s) => s.loadProject);
  const setActivePage = useCalendarStore((s) => s.setActivePage);
  
  const [loading, setLoading] = useState(id !== 'new');
  const [panelWidth, setPanelWidth] = useState(320); // default width

  useEffect(() => {
    if (id && id !== 'new') {
      if ((window as any).__TAURI_INTERNALS__) {
        import('@tauri-apps/plugin-fs').then(({ readTextFile, BaseDirectory }) => {
          readTextFile(`projects/${id}.json`, { baseDir: BaseDirectory.AppData })
            .then(data => {
              const parsedData: CalendarProject = JSON.parse(data);
              loadProject(parsedData);
              setLoading(false);
            })
            .catch(() => {
              alert('Error al cargar el proyecto local desde Tauri.');
              navigate('/');
            });
        }).catch(console.error);
        return;
      }

      fetch(`/api/projects/${id}`)
        .then(r => {
          if (!r.ok) throw new Error('Not found');
          return r.json();
        })
        .then(data => {
          const parsedData: CalendarProject = JSON.parse(data.data);
          loadProject(parsedData);
          setLoading(false);
        })
        .catch(() => {
          alert('Error al cargar el proyecto.');
          navigate('/');
        });
    } else {
      setLoading(false);
    }
  }, [id, loadProject, navigate]);

  // Synchronous flush save function
  const saveProject = (proj: CalendarProject) => {
    if (!proj.id || loading || id === 'new') return;
    
    if ((window as any).__TAURI_INTERNALS__) {
      import('@tauri-apps/plugin-fs').then(({ writeTextFile, BaseDirectory }) => {
        writeTextFile(`projects/${proj.id}.json`, JSON.stringify(proj), { baseDir: BaseDirectory.AppData }).catch(console.error);
      });
      return;
    }

    const data = JSON.stringify({ name: proj.name, data: JSON.stringify(proj) });
    // Use sendBeacon for reliable unmount saving if possible, or fallback to fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`/api/projects/${proj.id}`, new Blob([data], { type: 'application/json' }));
    } else {
      fetch(`/api/projects/${proj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true
      }).catch(console.error);
    }
  };

  // Auto-save logic (debounced)
  useEffect(() => {
    if (loading || !project.id || id === 'new') return;
    const timeoutId = setTimeout(() => {
      if ((window as any).__TAURI_INTERNALS__) {
        import('@tauri-apps/plugin-fs').then(({ writeTextFile, BaseDirectory }) => {
          writeTextFile(`projects/${project.id}.json`, JSON.stringify(project), { baseDir: BaseDirectory.AppData }).catch(console.error);
        });
        return;
      }

      fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: project.name, data: JSON.stringify(project) })
      }).catch(console.error);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [project, loading, id]);

  // Force save on unmount or tab close
  useEffect(() => {
    const handleBeforeUnload = () => saveProject(project);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveProject(project);
    };
  }, [project, loading, id]);

  // Resizing logic
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
    <div className="editor-layout" style={{ '--panel-width': `${panelWidth}px` } as React.CSSProperties}>
      {/* Top bar */}
      <div className="editor-layout__toolbar">
        <Toolbar />
      </div>

      {/* Left sidebar — Photos */}
      <div className="editor-layout__sidebar">
        <PhotoPanel />
      </div>

      <div 
        className="editor-layout__canvas" 
        style={{ position: 'relative', overflow: 'hidden' }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDragEnter={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
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

      {/* Right panel — Config */}
      <div className="editor-layout__panel" style={{ position: 'relative' }}>
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
          title="Arrastra para redimensionar"
        />

        {/* Layout selector */}
        <LayoutSelector />

        {/* Image offset controls (when a region is selected) */}
        {selectedRegion && (
          <OffsetControls
            regionId={selectedRegion.id}
            pageIndex={activePageIndex}
            transform={selectedRegion.transform}
            hasImage={!!selectedRegion.imageFileId}
            clipToSafeArea={selectedRegion.clipToSafeArea}
          />
        )}

        {/* Cover text editor (cover page only) */}
        <CoverTextPanel />

        {/* Typography config */}
        <TypographyPanel />

        {/* Day annotations (month pages only) */}
        <AnnotationPanel />
      </div>
    </div>
  );
};

export default EditorLayout;
