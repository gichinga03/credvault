import { useState, useRef, useEffect } from 'react'
import type { Credential, CopyFormat } from '../types'
import { COPY_FORMATS } from '../types'
import { copyCred } from '../api'

interface Props { cred: Credential }

export function CopyMenu({ cred }: Props) {
  const [open,   setOpen]   = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const ref   = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  async function handleCopy(format: CopyFormat, label: string) {
    try {
      const { formatted } = await copyCred(cred.id, format)
      await navigator.clipboard.writeText(formatted)
      setCopied(label)
      setOpen(false)
      clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        try {
          const cur = await navigator.clipboard.readText()
          if (cur === formatted) await navigator.clipboard.writeText('')
        } catch {}
        setCopied(null)
      }, 30_000)
    } catch (e) {
      console.error('copy failed', e)
    }
  }

  const formats = COPY_FORMATS[cred.type] ?? [{ label: 'Raw', value: 'raw' as CopyFormat }]

  return (
    <div className="copy-menu" ref={ref}>
      <button className={`btn-copy ${copied ? 'btn-copy--ok' : ''}`} onClick={() => setOpen(o => !o)}>
        {copied ? `✓ ${copied}` : 'Copy ▾'}
      </button>
      {open && (
        <div className="dropdown">
          {formats.map((f: { label: string; value: CopyFormat }) => (
            <button key={f.value} className="dropdown-item" onClick={() => handleCopy(f.value, f.label)}>
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}