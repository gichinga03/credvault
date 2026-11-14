import { useState, useEffect, useRef } from 'react'
import type { Credential, CredentialType, CredentialSource, Project } from '../types'
import { TYPE_LABELS, SUBTYPES, MULTILINE_SUBTYPES } from '../types'
import { createCred, updateCred } from '../api'

interface Props {
  project: Project
  editing: Credential | null
  onClose: () => void
  onSaved: (c: Credential) => void
}

const SOURCES: CredentialSource[] = ['phished', 'dumped', 'sprayed', 'loot', 'other']

export function AddCredModal({ project, editing, onClose, onSaved }: Props) {
  const type = project.type
  const subtypes = SUBTYPES[type]

  const [subtype,   setSubtype]   = useState(subtypes[0].value)
  const [label,     setLabel]     = useState('')
  const [username,  setUsername]  = useState('')
  const [secret,    setSecret]    = useState('')
  const [tags,      setTags]      = useState('')
  const [source,    setSource]    = useState<CredentialSource>('other')
  const [domain,    setDomain]    = useState('')
  const [tenantId,  setTenantId]  = useState('')
  const [accountId, setAccountId] = useState('')
  const [region,    setRegion]    = useState('')
  const [spn,       setSpn]       = useState('')
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editing) {
      setSubtype(editing.subtype ?? subtypes[0].value)
      setLabel(editing.label)
      setUsername(editing.username ?? '')
      setSecret('')
      setTags((editing.tags ?? []).join(', '))
      setSource((editing.source as CredentialSource) ?? 'other')
      setDomain(editing.metadata?.domain ?? '')
      setTenantId(editing.metadata?.tenant_id ?? '')
      setAccountId(editing.metadata?.account_id ?? '')
      setRegion(editing.metadata?.region ?? '')
      setSpn(editing.metadata?.spn ?? '')
    } else {
      setSubtype(subtypes[0].value)
      setLabel('')
      setUsername('')
      setSecret('')
      setTags('')
      setSource('other')
      setDomain('')
      setTenantId('')
      setAccountId('')
      setRegion('')
      setSpn('')
    }
  }, [editing])

  const isMultiline = MULTILINE_SUBTYPES.has(subtype)

  // Dynamic labels based on subtype
  const userLabel = () => {
    if (type === 'aws') return subtype === 'role_arn' ? 'Role ARN' : 'Access Key ID'
    if (type === 'azure') return 'Label (email, UPN, display name, client ID — anything)'
    if (type === 'ad') return 'Username (DOMAIN\\user or UPN)'
    if (type === 'ssh') return 'Username'
    if (type === 'api_token') return 'Service / App name'
    return 'Username'
  }

  const secretLabel = () => {
    const found = subtypes.find((s: { value: string; label: string }) => s.value === subtype)
    return found ? found.label : 'Secret'
  }

  const secretPlaceholder = () => {
    const m: Record<string, string> = {
      password:      'Enter password…',
      ntlm:          'aad3b435b51404eeaad3b435b51404ee:32ed87bdb5fdc5e9cba88547376818d4',
      tgt:           'Base64-encoded TGT blob (from Rubeus, Mimikatz, etc.)…',
      tgs:           'Base64-encoded TGS / service ticket…',
      silver_ticket:  'Base64-encoded silver ticket…',
      golden_ticket:  'Base64-encoded golden ticket…',
      rev2self:      'Token handle or impersonation context notes…',
      dpapi:         'Base64-encoded DPAPI blob or masterkey…',
      certificate:   '-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----',
      client_secret: 'Azure client secret value…',
      access_token:  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9…',
      refresh_token: 'Paste refresh token…',
      prt:           'Paste PRT value…',
      prt_cookie:    'x-ms-RefreshTokenCredential cookie value…',
      private_key:   '-----BEGIN OPENSSH PRIVATE KEY-----\n…\n-----END OPENSSH PRIVATE KEY-----',
      bearer:        'eyJhbGciOiJIUzI1NiJ9…',
      jwt:           'eyJhbGciOiJIUzI1NiJ9…',
      oauth2:        'ya29.a0AfB_byC…',
      cookie:        'session=abc123; __Secure-token=…',
      access_key:    'AKIAIOSFODNN7EXAMPLE',
      sts_token:     'Paste STS session token…',
      role_arn:      'arn:aws:iam::123456789012:role/RoleName',
      api_key:       'Paste API key…',
    }
    return m[subtype] ?? 'Paste value here…'
  }

  const needsUsername = !['tgt','tgs','silver_ticket','golden_ticket','dpapi','prt','prt_cookie','sts_token','cookie','oauth2','jwt','bearer','api_key'].includes(subtype)
  const needsSpn      = ['tgs','silver_ticket'].includes(subtype)

  async function handleSave() {
    if (!label.trim()) { setError('Label is required'); return }
    if (!secret && !editing) { setError('Secret / token is required'); return }
    setSaving(true)
    setError('')

    const metadata: Record<string, string> = {}
    if (domain)    metadata.domain     = domain
    if (tenantId)  metadata.tenant_id  = tenantId
    if (accountId) metadata.account_id = accountId
    if (region)    metadata.region     = region
    if (spn)       metadata.spn        = spn

    const payload = {
      project_id: project.id,
      label: label.trim(),
      type,
      subtype,
      username: username.trim(),
      secret,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      source,
      metadata,
    }

    try {
      const saved = editing ? await updateCred(editing.id, payload) : await createCred(payload)
      onSaved(saved)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className={`type-pill type-pill--${type}`}>{TYPE_LABELS[type]}</span>
            <h2>{editing ? 'Edit credential' : `Add ${TYPE_LABELS[type]} credential`}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          {/* Subtype selector */}
          <div className="field">
            <label>Credential subtype</label>
            <div className="subtype-grid">
              {subtypes.map(s => (
                <button
                  key={s.value}
                  className={`subtype-btn ${subtype === s.value ? 'subtype-btn--active' : ''}`}
                  onClick={() => setSubtype(s.value)}
                  type="button"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific metadata */}
          {type === 'ad' && (
            <div className="field">
              <label>Domain</label>
              <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="corp.local" />
            </div>
          )}
          {type === 'azure' && (
            <div className="field">
              <label>Tenant ID</label>
              <input value={tenantId} onChange={e => setTenantId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </div>
          )}
          {type === 'aws' && (
            <div className="field-row">
              <div className="field">
                <label>Account ID</label>
                <input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="123456789012" />
              </div>
              <div className="field">
                <label>Region</label>
                <input value={region} onChange={e => setRegion(e.target.value)} placeholder="us-east-1" />
              </div>
            </div>
          )}
          {needsSpn && (
            <div className="field">
              <label>SPN <span className="hint">e.g. MSSQLSvc/sql.corp.local:1433</span></label>
              <input value={spn} onChange={e => setSpn(e.target.value)} placeholder="ServiceClass/host:port" />
            </div>
          )}

          <div className="field">
            <label>Label <span className="hint">— what is this credential for?</span></label>
            <input
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. DA TGT from WKSTN-01, Prod access token"
            />
          </div>

          {needsUsername && (
            <div className="field">
              <label>{userLabel()}</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={type === 'azure' ? 'e.g. john@corp.com, App-Deploy-SP, 7f3a...' : type === 'ad' ? 'CORP\\jsmith or jsmith@corp.local' : ''}
              />
            </div>
          )}

          {/* Secret — big paste area for tickets/tokens, single line for passwords/keys */}
          <div className="field">
            <label>
              {secretLabel()}
              {editing && <span className="hint"> — leave blank to keep existing</span>}
            </label>
            {isMultiline
              ? <textarea
                  className="secret-area"
                  rows={subtype === 'private_key' || subtype === 'certificate' ? 10 : 6}
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  placeholder={secretPlaceholder()}
                  spellCheck={false}
                  autoComplete="off"
                />
              : <input
                  className="secret-input"
                  type={subtype === 'password' ? 'password' : 'text'}
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  placeholder={secretPlaceholder()}
                  spellCheck={false}
                  autoComplete="off"
                />
            }
          </div>

          <div className="field-row">
            <div className="field">
              <label>Tags <span className="hint">comma-separated</span></label>
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="da, kerberoastable, cracked"
              />
            </div>
            <div className="field">
              <label>Source</label>
              <select value={source} onChange={e => setSource(e.target.value as CredentialSource)}>
                {SOURCES.map((s: CredentialSource) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add credential'}
          </button>
        </div>
      </div>
    </div>
  )
}
