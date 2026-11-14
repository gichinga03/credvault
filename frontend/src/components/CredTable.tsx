import { useState } from 'react'
import type { Credential } from '../types'
import { SUBTYPES } from '../types'
import { burnCred, deleteCred } from '../api'
import { CopyMenu } from './CopyMenu'

interface Props {
  creds:    Credential[]
  onEdit:   (c: Credential) => void
  onDelete: (id: string) => void
  onBurn:   (id: string) => void
}

function subtypeLabel(cred: Credential): string {
  const list = SUBTYPES[cred.type as keyof typeof SUBTYPES]
  return list?.find(s => s.value === cred.subtype)?.label ?? cred.subtype ?? '—'
}

function CredRow({ cred, onEdit, onDelete, onBurn }: { cred: Credential } & Omit<Props, 'creds'>) {
  const [menu,       setMenu]       = useState(false)
  const [confirming, setConfirming] = useState<'burn' | 'delete' | null>(null)

  async function handleBurn() {
    await burnCred(cred.id)
    onBurn(cred.id)
    setConfirming(null)
    setMenu(false)
  }

  async function handleDelete() {
    await deleteCred(cred.id)
    onDelete(cred.id)
    setConfirming(null)
    setMenu(false)
  }

  return (
    <tr className={`cred-row ${!cred.valid ? 'cred-row--burned' : ''}`}>
      <td>
        <div className="cred-label">{cred.label}</div>
        {cred.tags && cred.tags.length > 0 && (
          <div className="tags">
            {cred.tags.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        )}
      </td>
      <td><span className="subtype-label">{subtypeLabel(cred)}</span></td>
      <td><code className="username">{cred.username || '—'}</code></td>
      <td><span className="source-text">{cred.source || '—'}</span></td>
      <td><span className={`dot ${cred.valid ? 'dot--ok' : 'dot--burned'}`} /></td>
      <td>
        <div className="row-actions">
          <CopyMenu cred={cred} />
          <div className="action-menu">
            <button className="btn-more" onClick={() => { setMenu(o => !o); setConfirming(null) }}>⋯</button>
            {menu && (
              <div className="dropdown dropdown--right">
                {confirming === null && <>
                  <button className="dropdown-item" onClick={() => { onEdit(cred); setMenu(false) }}>Edit</button>
                  {cred.valid && (
                    <button className="dropdown-item dropdown-item--danger" onClick={() => setConfirming('burn')}>Mark burned</button>
                  )}
                  <button className="dropdown-item dropdown-item--danger" onClick={() => setConfirming('delete')}>Delete</button>
                </>}
                {confirming === 'burn' && <>
                  <span className="dropdown-label">Mark as burned?</span>
                  <button className="dropdown-item dropdown-item--danger" onClick={handleBurn}>Yes, burn it</button>
                  <button className="dropdown-item" onClick={() => setConfirming(null)}>Cancel</button>
                </>}
                {confirming === 'delete' && <>
                  <span className="dropdown-label">Delete permanently?</span>
                  <button className="dropdown-item dropdown-item--danger" onClick={handleDelete}>Yes, delete</button>
                  <button className="dropdown-item" onClick={() => setConfirming(null)}>Cancel</button>
                </>}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

export function CredTable({ creds, onEdit, onDelete, onBurn }: Props) {
  if (creds.length === 0) {
    return <div className="empty">No credentials yet. Add one above.</div>
  }
  return (
    <div className="table-wrap">
      <table className="cred-table">
        <thead>
          <tr>
            <th>Label / Tags</th>
            <th>Subtype</th>
            <th>Username / ID</th>
            <th>Source</th>
            <th>Valid</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {creds.map(c => (
            <CredRow key={c.id} cred={c} onEdit={onEdit} onDelete={onDelete} onBurn={onBurn} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
