import { useRef, useState } from 'react'
import type { CredentialType, Project } from '../types'
import { TYPE_LABELS } from '../types'
import { createProject } from '../api'

interface Props {
  onClose: () => void
  onSaved: (p: Project) => void
}

const TYPES: CredentialType[] = ['aws', 'azure', 'ad', 'ssh', 'api_token', 'generic']

export function NewProjectModal({ onClose, onSaved }: Props) {
  const [name,  setName]  = useState('')
  const [type,  setType]  = useState<CredentialType>('generic')
  const [desc,  setDesc]  = useState('')
  const [error, setError] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  async function handleSave() {
    if (!name.trim()) { setError('Name is required'); return }
    try {
      const p = await createProject(name.trim(), type, desc.trim())
      onSaved(p)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="modal modal--sm" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New project</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Project name</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Acme Corp - Internal" />
          </div>

          <div className="field">
            <label>Credential type <span className="hint">— this project holds only this type</span></label>
            <div className="type-grid">
              {TYPES.map(t => (
                <button
                  key={t}
                  className={`type-card ${type === t ? 'type-card--active' : ''} type-card--${t}`}
                  onClick={() => setType(t)}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Description <span className="hint">optional</span></label>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Short note about this engagement" />
          </div>

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Create project</button>
        </div>
      </div>
    </div>
  )
}
