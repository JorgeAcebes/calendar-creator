import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalendarStore } from '@/store/calendarStore';
import { Calendar, Plus, Copy, Trash2, ArrowRight } from 'lucide-react';
import type { CalendarProject } from '@calendar-creator/shared-types';

interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/* ── inline styles (no Tailwind — pure CSS) ────────────────────────────── */

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-ui)',
    padding: '48px 40px',
    position: 'relative' as const,
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 56,
    flexWrap: 'wrap' as const,
    gap: 24,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#ffffff',
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    margin: '4px 0 0',
  },
  createBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    background: '#ffffff',
    color: '#000000',
    padding: '12px 28px',
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    fontFamily: 'var(--font-ui)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  countBadge: {
    fontSize: 12,
    fontWeight: 500,
    padding: '4px 14px',
    borderRadius: 999,
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-glass-border)',
    color: 'var(--color-text-secondary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 20,
  },
  card: {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-bg-elevated)',
    borderRadius: 16,
    padding: 24,
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
    minHeight: 180,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'var(--color-bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-accent)',
    marginBottom: 20,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 600,
    color: '#ffffff',
    margin: 0,
    lineHeight: 1.3,
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: 11,
    color: 'var(--color-text-secondary)',
  },
  cardDateLabel: {
    fontSize: 10,
    color: 'var(--color-text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    fontWeight: 600,
    marginBottom: 2,
    display: 'block',
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--color-bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-secondary)',
    transition: 'background 0.2s, color 0.2s',
  },
  cardActions: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    display: 'flex',
    gap: 4,
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-secondary)',
    transition: 'background 0.15s, color 0.15s',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '80px 20px',
    border: '1px dashed var(--color-bg-elevated)',
    borderRadius: 24,
    background: 'rgba(28, 28, 30, 0.4)',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    margin: '0 auto 24px',
    borderRadius: '50%',
    background: 'var(--color-bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(8px)',
    padding: 16,
  },
  modal: {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-glass-border)',
    borderRadius: 20,
    padding: 32,
    maxWidth: 400,
    width: '100%',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    animation: 'scaleIn 0.2s ease-out both',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 6px',
    letterSpacing: '-0.01em',
  },
  modalDesc: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    margin: '0 0 28px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 8,
  },
  fieldInput: {
    width: '100%',
    background: 'var(--color-bg-tertiary)',
    border: '1px solid transparent',
    color: '#ffffff',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'var(--font-ui)',
    boxSizing: 'border-box' as const,
  },
  modalButtons: {
    display: 'flex',
    gap: 12,
    marginTop: 28,
  },
  btnCancel: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 12,
    border: 'none',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    background: 'var(--color-bg-tertiary)',
    color: '#ffffff',
    transition: 'background 0.15s',
    fontFamily: 'var(--font-ui)',
  },
  btnConfirm: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 12,
    border: 'none',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    background: 'var(--color-accent)',
    color: '#ffffff',
    transition: 'background 0.15s, opacity 0.15s',
    fontFamily: 'var(--font-ui)',
  },
} as const;

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const navigate = useNavigate();
  const initProject = useCalendarStore(state => state.initProject);
  const isTauri = !!(window as any).__TAURI_INTERNALS__;

  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('Nuevo Calendario');
  const [newProjectYear, setNewProjectYear] = useState(new Date().getFullYear() + 1);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      if (isTauri) {
        const { readDir, readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        try {
          const entries = await readDir('', { baseDir: BaseDirectory.AppData });
          const loadedProjects: ProjectListItem[] = [];
          for (const entry of entries) {
            if (entry.name && entry.name.endsWith('.json')) {
              try {
                const data = await readTextFile(entry.name, { baseDir: BaseDirectory.AppData });
                const proj = JSON.parse(data);
                loadedProjects.push({
                  id: proj.id,
                  name: proj.name,
                  createdAt: proj.createdAt || new Date().toISOString(),
                  updatedAt: proj.updatedAt || new Date().toISOString()
                });
              } catch (e) {
                console.error('Error parsing', entry.name, e);
              }
            }
          }
          loadedProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setProjects(loadedProjects);
        } catch (e) {
          console.error('No appdata dir found or error reading', e);
          setProjects([]);
        }
      } else {
        const res = await fetch('/api/projects');
        if (res.ok) setProjects(await res.json());
      }
    } catch (e) {
      console.error('Failed to load projects', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfirm = async () => {
    initProject(newProjectName, newProjectYear, 'es-ES');
    const newProject = useCalendarStore.getState().project;
    try {
      if (isTauri) {
        const { writeTextFile, BaseDirectory, mkdir } = await import('@tauri-apps/plugin-fs');
        try { await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true }); } catch (e) {}
        await writeTextFile(`${newProject.id}.json`, JSON.stringify(newProject), { baseDir: BaseDirectory.AppData });
        navigate(`/editor/${newProject.id}`);
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newProject.name, data: JSON.stringify(newProject) }),
        });
        if (res.ok) {
          navigate(`/editor/${newProject.id}`);
        } else {
          throw new Error('Server error');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar el nuevo proyecto');
    }
  };

  const handleOpenProject = (id: string) => navigate(`/editor/${id}`);

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Seguro que deseas eliminar este proyecto de forma permanente?')) return;
    try {
      if (isTauri) {
        const { remove, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        await remove(`${id}.json`, { baseDir: BaseDirectory.AppData });
        loadProjects();
      } else {
        await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        loadProjects();
      }
    } catch (e) { console.error(e); }
  };

  const handleDuplicateProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isTauri) {
        const { readTextFile, writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        const data = await readTextFile(`${id}.json`, { baseDir: BaseDirectory.AppData });
        const parsedData: CalendarProject = JSON.parse(data);
        parsedData.name = `${parsedData.name} (Copia)`;
        parsedData.id = crypto.randomUUID();
        await writeTextFile(`${parsedData.id}.json`, JSON.stringify(parsedData), { baseDir: BaseDirectory.AppData });
        loadProjects();
      } else {
        const res = await fetch(`/api/projects/${id}`);
        const project = await res.json();
        const parsedData: CalendarProject = JSON.parse(project.data);
        parsedData.name = `${parsedData.name} (Copia)`;
        parsedData.id = crypto.randomUUID();
        const saveRes = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: parsedData.name, data: JSON.stringify(parsedData) }),
        });
        if (saveRes.ok) loadProjects();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoBox}>
              <Calendar size={26} color="var(--color-accent)" strokeWidth={1.5} />
            </div>
            <div>
              <h1 style={styles.title}>Calendar Creator</h1>
              <p style={styles.subtitle}>Diseña tus calendarios fotográficos profesionales</p>
            </div>
          </div>
          <button
            style={styles.createBtn}
            onClick={() => setShowModal(true)}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Plus size={18} />
            Crear Calendario
          </button>
        </header>

        {/* Section header */}
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Mis Calendarios</h2>
          <span style={styles.countBadge}>
            {projects.length} {projects.length === 1 ? 'Diseño' : 'Diseños'}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
            <div className="animate-pulse" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--color-accent)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ marginLeft: 16, color: 'var(--color-text-secondary)', fontSize: 13 }}>Cargando galería...</span>
          </div>
        ) : projects.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Calendar size={28} color="var(--color-text-secondary)" />
            </div>
            <p style={{ fontSize: 18, fontWeight: 500, color: '#ffffff', margin: '0 0 8px' }}>No hay calendarios todavía</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, maxWidth: 320, marginInline: 'auto' }}>
              Empieza tu primer proyecto fotográfico haciendo clic en el botón superior.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {projects.map(p => (
              <div
                key={p.id}
                style={{
                  ...styles.card,
                  borderColor: hoveredCard === p.id ? 'var(--color-text-tertiary)' : 'var(--color-bg-elevated)',
                  boxShadow: hoveredCard === p.id ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
                }}
                onClick={() => handleOpenProject(p.id)}
                onMouseEnter={() => setHoveredCard(p.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Actions */}
                <div style={{ ...styles.cardActions, opacity: hoveredCard === p.id ? 1 : 0 }}>
                  <button
                    style={styles.actionBtn}
                    onClick={e => handleDuplicateProject(p.id, e)}
                    title="Duplicar"
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-tertiary)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    style={styles.actionBtn}
                    onClick={e => handleDeleteProject(p.id, e)}
                    title="Eliminar"
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,69,58,0.12)'; e.currentTarget.style.color = 'var(--color-error)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div style={styles.cardIcon}>
                  <Calendar size={20} />
                </div>
                <h3 style={styles.cardName}>{p.name}</h3>
                <div style={styles.cardFooter}>
                  <div>
                    <span style={styles.cardDateLabel}>Actualizado</span>
                    <span style={styles.cardDate}>{new Date(p.updatedAt).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div style={{
                    ...styles.cardArrow,
                    background: hoveredCard === p.id ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                    color: hoveredCard === p.id ? '#fff' : 'var(--color-text-secondary)',
                  }}>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation modal */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Nuevo Proyecto</h3>
            <p style={styles.modalDesc}>Configura los detalles básicos de tu calendario fotográfico.</p>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.fieldLabel}>Nombre del Calendario</label>
              <input
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                style={styles.fieldInput}
                placeholder="Ej. Viaje a Japón"
                autoFocus
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'transparent')}
              />
            </div>
            <div>
              <label style={styles.fieldLabel}>Año</label>
              <input
                type="number"
                value={newProjectYear}
                onChange={e => setNewProjectYear(Number(e.target.value))}
                style={styles.fieldInput}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'transparent')}
              />
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.btnCancel}
                onClick={() => setShowModal(false)}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
              >
                Cancelar
              </button>
              <button
                style={{
                  ...styles.btnConfirm,
                  opacity: newProjectName.trim() ? 1 : 0.5,
                  cursor: newProjectName.trim() ? 'pointer' : 'not-allowed',
                }}
                onClick={handleCreateConfirm}
                disabled={!newProjectName.trim()}
                onMouseEnter={e => { if (newProjectName.trim()) e.currentTarget.style.background = 'var(--color-accent-active)'; }}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
              >
                Crear y Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
