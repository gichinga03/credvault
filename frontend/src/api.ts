import {
  ListProjects,
  CreateProject,
  DeleteProject,
  ListCreds,
  CreateCred,
  UpdateCred,
  RevealCred,
  BurnCred,
  DeleteCred,
  CopyCred,
} from '../wailsjs/go/main/App'

import type { CopyFormat } from './types'

export const listProjects  = ()                                              => ListProjects()
export const createProject = (name: string, type: string, description = '') => CreateProject(name, type, description)
export const deleteProject = (id: string)                                   => DeleteProject(id)

export interface CredFilter { project?: string; type?: string; valid?: boolean; q?: string }

export const listCreds   = (f: CredFilter = {}) => ListCreds(f.project ?? '', f.type ?? '', f.q ?? '', f.valid ?? false)
export const createCred  = (payload: any)        => CreateCred(JSON.stringify(payload))
export const updateCred  = (id: string, p: any)  => UpdateCred(id, JSON.stringify(p))
export const revealCred  = (id: string)          => RevealCred(id)
export const burnCred    = (id: string)          => BurnCred(id)
export const deleteCred  = (id: string)          => DeleteCred(id)
export const copyCred    = (id: string, fmt: CopyFormat) => CopyCred(id, fmt).then(f => ({ formatted: f }))
