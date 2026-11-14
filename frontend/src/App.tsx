import { useState, useEffect, useCallback } from 'react'
import type { Credential, CredentialType } from './types'
import type { Project } from './types'
import { TYPE_LABELS, TYPE_COLORS } from './types'
import { listProjects, listCreds, deleteProject } from './api'
import { CredTable }        from './components/CredTable'
import { AddCredModal }     from './components/AddCredModal'
import { NewProjectModal }  from './components/NewProjectModal'
import './app.css'

export default function App() {
  const [projects,       setProjects]       = useState<Project[]>([])
  const [activeProject,  setActiveProject]  = useState<Project | null>(null)
  const [creds,          setCreds]          = useState<Credential[]>([])
  const [search,         setSearch]         = useState('')
  const [validOnly,      setValidOnly]      = useState(false)
  const [showAdd,        setShowAdd]        = useState(false)
  const [editing,        setEditing]        = useState<Credential | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => {
    listProjects().then(ps => {
      setProjects(ps)
      if (ps.length > 0) setActiveProject(ps[0])
    })
  }, [])

  const fetchCreds = useCallback(async () => {
    if (!activeProject) { setCreds([]); return }
    const data = await listCreds({
      project: activeProject.id,
      valid:   validOnly || undefined,
      q:       search    || undefined,
    })
    setCreds(data)
  }, [activeProject, validOnly, search])

  useEffect(() => { fetchCreds() }, [fetchCreds])

  async function handleDeleteProject(p: Project) {
    if (!confirm(`Delete project "${p.name}" and all its credentials?`)) return
    await deleteProject(p.id)
    const next = projects.filter(x => x.id !== p.id)
    setProjects(next)
    setActiveProject(next[0] ?? null)
  }

  function handleSaved(cred: Credential) {
    setCreds(prev => {
      const idx = prev.findIndex(c => c.id === cred.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = cred; return n }
      return [cred, ...prev]
    })
    setShowAdd(false)
    setEditing(null)
  }

  const typeColor = activeProject ? TYPE_COLORS[activeProject.type] : '#8899aa'

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">CredVault</div>

        <button className="btn-new-project" onClick={() => setShowNewProject(true)}>
          + New project
        </button>

        <nav className="project-nav">
          {projects.map(p => (
            <div
              key={p.id}
              className={`project-item ${activeProject?.id === p.id ? 'project-item--active' : ''}`}
              onClick={() => setActiveProject(p)}
            >
              <div className="project-item-left">
                <span
                  className="project-type-dot"
                  style={{ background: TYPE_COLORS[p.type] }}
                />
                <div>
                  <div className="project-name">{p.name}</div>
                  <div className="project-type-label">{TYPE_LABELS[p.type]}</div>
                </div>
              </div>
              <button
                className="btn-del-project"
                onClick={e => { e.stopPropagation(); handleDeleteProject(p) }}
                title="Delete project"
              >✕</button>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="sidebar-empty">No projects yet</div>
          )}
        </nav>
      </aside>

      {/* Main */}
      <main className="main">
        {activeProject ? <>
          {/* Project header */}
          <div className="project-header" style={{ borderColor: typeColor }}>
            <div className="project-header-left">
              <span className="project-header-type" style={{ color: typeColor }}>
                {TYPE_LABELS[activeProject.type]}
              </span>
              <h1 className="project-header-name">{activeProject.name}</h1>
              {activeProject.description && (
                <span className="project-header-desc">{activeProject.description}</span>
              )}
            </div>
            <button
              className="btn-primary"
              onClick={() => { setEditing(null); setShowAdd(true) }}
            >
              + Add credential
            </button>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="Search label, username, tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <label className="valid-toggle">
              <input type="checkbox" checked={validOnly} onChange={e => setValidOnly(e.target.checked)} />
              Valid only
            </label>
            <span className="cred-count">{creds.length} credential{creds.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Table */}
          <CredTable
            creds={creds}
            onEdit={c => { setEditing(c); setShowAdd(true) }}
            onDelete={id => setCreds(prev => prev.filter(c => c.id !== id))}
            onBurn={id => setCreds(prev => prev.map(c => c.id === id ? { ...c, valid: false } : c))}
          />
        </> : (
          <div className="no-project">
            <p>Create a project to get started</p>
            <button className="btn-primary" onClick={() => setShowNewProject(true)}>+ New project</button>
          </div>
        )}
      </main>

      {/* Modals */}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onSaved={p => {
            setProjects(prev => [p, ...prev])
            setActiveProject(p)
            setShowNewProject(false)
          }}
        />
      )}

      {showAdd && activeProject && (
        <AddCredModal
          project={activeProject}
          editing={editing}
          onClose={() => { setShowAdd(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}