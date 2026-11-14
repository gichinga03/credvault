export type CredentialType = 'aws' | 'azure' | 'ad' | 'ssh' | 'api_token' | 'generic'
export type CredentialSource = 'phished' | 'dumped' | 'sprayed' | 'loot' | 'other'

export const AD_SUBTYPES = [
  { value: 'password',      label: 'Password' },
  { value: 'ntlm',          label: 'NTLM Hash' },
  { value: 'tgt',           label: 'Kerberos TGT' },
  { value: 'tgs',           label: 'Kerberos TGS / Service Ticket' },
  { value: 'silver_ticket', label: 'Silver Ticket' },
  { value: 'golden_ticket', label: 'Golden Ticket' },
  { value: 'rev2self',      label: 'rev2self / Impersonation Token' },
  { value: 'dpapi',         label: 'DPAPI Blob / Masterkey' },
  { value: 'certificate',   label: 'Certificate (PFX/PEM)' },
  { value: 'other',         label: 'Other' },
] as const

export const AZURE_SUBTYPES = [
  { value: 'client_secret', label: 'Client Secret' },
  { value: 'access_token',  label: 'Access Token (JWT)' },
  { value: 'refresh_token', label: 'Refresh Token' },
  { value: 'prt',           label: 'PRT (Primary Refresh Token)' },
  { value: 'prt_cookie',    label: 'PRT Cookie (x-ms-RefreshTokenCredential)' },
  { value: 'certificate',   label: 'Service Principal Certificate' },
  { value: 'password',      label: 'User Password' },
  { value: 'other',         label: 'Other' },
] as const

export const AWS_SUBTYPES = [
  { value: 'access_key',    label: 'IAM Access Key' },
  { value: 'sts_token',     label: 'STS Session Token' },
  { value: 'role_arn',      label: 'Role ARN (assume-role)' },
  { value: 'other',         label: 'Other' },
] as const

export const SSH_SUBTYPES = [
  { value: 'private_key',   label: 'Private Key (RSA/ED25519)' },
  { value: 'certificate',   label: 'SSH Certificate' },
  { value: 'password',      label: 'Password' },
  { value: 'other',         label: 'Other' },
] as const

export const API_SUBTYPES = [
  { value: 'bearer',        label: 'Bearer Token' },
  { value: 'jwt',           label: 'JWT' },
  { value: 'oauth2',        label: 'OAuth2 Token' },
  { value: 'cookie',        label: 'Session Cookie' },
  { value: 'api_key',       label: 'API Key' },
  { value: 'other',         label: 'Other' },
] as const

export const GENERIC_SUBTYPES = [
  { value: 'other',         label: 'Other' },
] as const

export const SUBTYPES: Record<string, readonly { value: string; label: string }[]> = {
  aws:       AWS_SUBTYPES,
  azure:     AZURE_SUBTYPES,
  ad:        AD_SUBTYPES,
  ssh:       SSH_SUBTYPES,
  api_token: API_SUBTYPES,
  generic:   GENERIC_SUBTYPES,
}

export const MULTILINE_SUBTYPES = new Set([
  'tgt', 'tgs', 'silver_ticket', 'golden_ticket', 'dpapi', 'certificate',
  'private_key', 'access_token', 'refresh_token', 'prt', 'prt_cookie',
  'jwt', 'oauth2', 'cookie',
])

// Use string for type/subtype so Wails-generated types are compatible
export interface Credential {
  id:         string
  project_id: string
  label:      string
  type:       string
  subtype:    string
  username?:  string
  secret?:    string
  metadata?:  Record<string, string>
  tags?:      string[]
  source?:    string
  valid:      boolean
  created_at: string
  operator?:  string
}

export interface Project {
  id:           string
  name:         string
  type:         string
  description?: string
  created_at:   string
}

export type CopyFormat =
  | 'env' | 'config'
  | 'azcli' | 'az_token'
  | 'impacket' | 'cme' | 'plain' | 'rubeus' | 'mimikatz'
  | 'cmd' | 'bearer' | 'header' | 'raw'

export const COPY_FORMATS: Record<string, { label: string; value: CopyFormat }[]> = {
  aws: [
    { label: 'Env block',           value: 'env' },
    { label: '~/.aws/credentials',  value: 'config' },
    { label: 'Raw',                 value: 'raw' },
  ],
  azure: [
    { label: 'az login (SP)',       value: 'azcli' },
    { label: 'Env block',           value: 'env' },
    { label: 'Raw token',           value: 'raw' },
  ],
  ad: [
    { label: 'Impacket',            value: 'impacket' },
    { label: 'CrackMapExec',        value: 'cme' },
    { label: 'Plain (DOMAIN\\user)',value: 'plain' },
    { label: 'Rubeus /ptt',         value: 'rubeus' },
    { label: 'Mimikatz ptt',        value: 'mimikatz' },
    { label: 'Raw',                 value: 'raw' },
  ],
  ssh: [
    { label: 'ssh -i command',      value: 'cmd' },
    { label: 'Raw key',             value: 'raw' },
  ],
  api_token: [
    { label: 'Bearer header',       value: 'bearer' },
    { label: 'X-API-Key header',    value: 'header' },
    { label: 'Raw',                 value: 'raw' },
  ],
  generic: [
    { label: 'Raw',                 value: 'raw' },
  ],
}

export const TYPE_LABELS: Record<string, string> = {
  aws: 'AWS', azure: 'Azure', ad: 'AD', ssh: 'SSH', api_token: 'API Token', generic: 'Generic',
}

export const TYPE_COLORS: Record<string, string> = {
  aws: '#f0a040', azure: '#4a9eff', ad: '#b06aff',
  ssh: '#4caf7d', api_token: '#d4c840', generic: '#8899aa',
}
