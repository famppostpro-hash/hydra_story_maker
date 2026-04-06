export interface Project {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Character {
  id: string
  project_id: string
  name: string
  role?: string
  background?: string
  motivation?: string
  traits?: string[]
  avatar_color: string
  created_at: string
  updated_at: string
}

export interface Scene {
  id: string
  project_id: string
  title: string
  description?: string
  character_ids?: string[]
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
}

export interface Connection {
  id: string
  project_id: string
  source_scene_id: string
  target_scene_id: string
  label?: string
  created_at: string
}

export interface ConflictOption {
  id: number
  title: string
  description: string
  tension: string
}

export interface Conflict {
  id: string
  project_id: string
  connection_id: string
  selected_option: number | null
  options: ConflictOption[]
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
}
