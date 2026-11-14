import type { CredentialType } from '../types'
import { TYPE_LABELS } from '../types'

interface Props {
  projects:  { id: string; name: string }[]
  projectId: string
  type:      CredentialType | ''
  validOnly: boolean
  search:    string
  onProject:   (v: string) => void
  onType:      (v: CredentialType | '') => void
  onValidOnly: (v: boolean) => void
  onSearch:    (v: string) => void
}

export function FilterBar({
  projects, projectId, type, validOnly, search,
  onProject, onType, onValidOnly, onSearch,
}: Props) {
  return (
    <div className="filter-bar">
      <select value={projectId} onChange={e => onProject(e.target.value)}>
        <option value="">All projects</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <select value={type} onChange={e => onType(e.target.value as CredentialType | '')}>
        <option value="">All types</option>
        {(Object.keys(TYPE_LABELS) as CredentialType[]).map(t => (
          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
        ))}
      </select>

      <label className="valid-toggle">
        <input
          type="checkbox"
          checked={validOnly}
          onChange={e => onValidOnly(e.target.checked)}
        />
        Valid only
      </label>

      <input
        className="search-input"
        type="text"
        placeholder="Search label, username, tags…"
        value={search}
        onChange={e => onSearch(e.target.value)}
      />
    </div>
  )
}