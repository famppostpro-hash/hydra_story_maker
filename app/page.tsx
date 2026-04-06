'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  Connection, Edge, Node, BackgroundVariant,
  Panel, NodeChange, EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { supabase } from '@/lib/supabase'
import { generateConflicts } from '@/lib/ai'
import { Project, Scene, Character, Conflict, Connection as Conn } from '@/types'
import SceneNode from '@/components/nodes/SceneNode'
import ConflictNode from '@/components/nodes/ConflictNode'
import ConflictEdge from '@/components/nodes/ConflictEdge'
import SceneEditor from '@/components/SceneEditor'
import CharacterPanel from '@/components/CharacterPanel'
import SettingsPanel, { AISettings } from '@/components/SettingsPanel'

// ---------------------------------------------------------------------------
// Node / Edge type registrations
// ---------------------------------------------------------------------------
const nodeTypes = { scene: SceneNode, conflict: ConflictNode }
const edgeTypes = { conflict: ConflictEdge }

// ---------------------------------------------------------------------------
// Default AI settings
// ---------------------------------------------------------------------------
const DEFAULT_AI: AISettings = { endpoint: 'http://localhost:1234', model: 'gemma-3-4b-it-qat' }

function loadAISettings(): AISettings {
  if (typeof window === 'undefined') return DEFAULT_AI
  try {
    const raw = localStorage.getItem('hydra_ai_settings')
    return raw ? JSON.parse(raw) : DEFAULT_AI
  } catch { return DEFAULT_AI }
}

function saveAISettings(s: AISettings) {
  if (typeof window !== 'undefined') localStorage.setItem('hydra_ai_settings', JSON.stringify(s))
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [connections, setConnections] = useState<Conn[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const [editingScene, setEditingScene] = useState<Scene | null>(null)
  const [sideTab, setSideTab] = useState<'characters' | 'settings'>('characters')
  const [showSide, setShowSide] = useState(true)
  const [aiSettings, setAISettings] = useState<AISettings>(DEFAULT_AI)
  const [generatingEdgeId, setGeneratingEdgeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const generatingRef = useRef<Set<string>>(new Set())

  // Load AI settings from localStorage
  useEffect(() => { setAISettings(loadAISettings()) }, [])

  // Load projects
  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data || [])
    if (data && data.length > 0) {
      const last = localStorage.getItem('hydra_last_project')
      const found = data.find((p: Project) => p.id === last) || data[0]
      setActiveProject(found)
    }
    setLoading(false)
  }

  // Load project data when active project changes
  useEffect(() => {
    if (!activeProject) return
    localStorage.setItem('hydra_last_project', activeProject.id)
    loadProjectData(activeProject.id)
  }, [activeProject])

  async function loadProjectData(projectId: string) {
    const [sc, ch, co, conf] = await Promise.all([
      supabase.from('scenes').select('*').eq('project_id', projectId),
      supabase.from('characters').select('*').eq('project_id', projectId),
      supabase.from('connections').select('*').eq('project_id', projectId),
      supabase.from('conflicts').select('*').eq('project_id', projectId),
    ])
    setScenes(sc.data || [])
    setCharacters(ch.data || [])
    setConnections(co.data || [])
    setConflicts(conf.data || [])
  }

  // Build React Flow nodes + edges from DB data
  useEffect(() => {
    if (!activeProject) return

    const sceneNodes: Node[] = scenes.map(s => ({
      id: s.id,
      type: 'scene',
      position: { x: s.position_x, y: s.position_y },
      data: {
        id: s.id,
        title: s.title,
        description: s.description,
        character_ids: s.character_ids,
        characters,
        onEdit: (id: string) => {
          const scene = scenes.find(sc => sc.id === id)
          if (scene) setEditingScene(scene)
        },
      },
    }))

    const conflictNodes: Node[] = conflicts.map(c => ({
      id: `conflict-${c.id}`,
      type: 'conflict',
      position: { x: c.position_x, y: c.position_y },
      data: {
        id: c.id,
        options: c.options,
        selected_option: c.selected_option,
        onSelect: handleSelectOption,
      },
    }))

    setNodes([...sceneNodes, ...conflictNodes])

    // Conflict edge IDs that have been generated
    const conflictConnIds = new Set(conflicts.map(c => c.connection_id))

    const edgeList: Edge[] = connections.map(conn => ({
      id: conn.id,
      source: conn.source_scene_id,
      target: conn.target_scene_id,
      type: 'conflict',
      data: {
        connectionId: conn.id,
        label: conn.label,
        hasConflict: conflictConnIds.has(conn.id),
        isGener!ting: generatingEdgeId === conn.id,
        onGenerate: handleGenerateConflict,
      },
    }))

    setEdges(edgeList)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, characters, connections, conflicts, generatingEdgeId, activeProject])

  // ---------------------------------------------------------------------------
  // Scene CRUD
  // ---------------------------------------------------------------------------
  const addScene = async () => {
    if (!activeProject) return
    const { data, error } = await supabase.from('scenes').insert({
      project_id: activeProject.id,
      title: 'New Scene',
      position_x: 100 + Math.random() * 400,
      position_y: 100 + Math.random() * 200,
    }).select().single()
    if (!error && data) setScenes(prev => [...prev, data])
  }

  const updateScene = async (id: string, updates: Partial<Scene>) => {
    const { data, error } = await supabase.from('scenes').update(updates).eq('id', id).select().single()
    if (!error && data) setScenes(prev => prev.map(s => s.id === id ? data : s))
  }

  const deleteScene = async (id: string) => {
    await supabase.from('scenes').delete().eq('id', id)
    setScenes(prev => prev.filter(s => s.id !== id))
  }

  // ---------------------------------------------------------------------------
  // Node position save
  // ---------------------------------------------------------------------------
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes)
    changes.forEach(change => {
      if (change.type === 'position' && !change.dragging && change.position) {
        const id = change.id
        if (id.startsWith('conflict-')) {
          const conflictId = id.replace('conflict-', '')
          supabase.from('conflicts').update({ position_x: change.position.x, position_y: change.position.y }).eq('id', conflictId)
        } else {
          supabase.from('scenes').update({ position_x: change.position.x, position_y: change.position.y }).eq('id', id)
        }
      }
    })
  }, [onNodesChange])

  // ---------------------------------------------------------------------------
  // Edge connect
  // ---------------------------------------------------------------------------
  const onConnect = useCallback(async (params: Connection) => {
    if (!activeProject) return
    const { data, error } = await supabase.from('connections').insert({
      project_id: activeProject.id,
      source_scene_id: params.source,
      target_scene_id: params.target,
    }).select().single()
    if (!error && data) {
      setConnections(prev => [...prev, data])
    }
  }, [activeProject])

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes)
    changes.forEach(change => {
      if (change.type === 'remove') {
        supabase.from('connections').delete().eq('id', change.id)
        setConnections(prev => prev.filter(c => c.id !== change.id))
      }
    })
  }, [onEdgesChange])

  // ---------------------------------------------------------------------------
  // AI Conflict generation
  // ---------------------------------------------------------------------------
  const handleGenerateConflict = useCallback(async (connectionId: string) => {
    if (generatingRef.current.has(connectionId)) return
    generatingRef.current.add(connectionId)
    setGeneratingEdgeId(connectionId)

    const conn = connections.find(c => c.id === connectionId)
    if (!conn || !activeProject) { generatingRef.current.delete(connectionId); setGeneratingEdgeId(null); return }

    const source = scenes.find(s => s.id === conn.source_scene_id)
    const target = scenes.find(s => s.id === conn.target_scene_id)
    if (!source || !target) { generatingRef.current.delete(connectionId); setGeneratingEdgeId(null); return }

    try {
      const options = await generateConflicts({
        sourceScene: source,
        targetScene: target,
        characters,
        apiEndpoint: aiSettings.endpoint,
        model: aiSettings.model,
      })

      // Find midpoint for conflict node position
      const midX = (source.position_x + target.position_x) / 2
      const midY = (source.position_y + target.position_y) / 2 + 120

      // Delete existing conflict for this connection if any
      const existing = conflicts.find(c => c.connection_id === connectionId)
      if (existing) await supabase.from('conflicts').delete().eq('id', existing.id)

      const { data, error } = await supabase.from('conflicts').insert({
        project_id: activeProject.id,
        connection_id: connectionId,
        options,
        position_x: midX,
        position_y: midY,
      }).select().single()

      if (!error && data) {
        setConflicts(prev => [...prev.filter(c => c.connection_id !== connectionId), data])
      }
    } catch (err) {
      console.error('AI generation failed:', err)
      alert(`AI Error: ${err instanceof Error ? err.message : 'Unknown error'}\n\nCheck your LM Studio endpoint in Settings.`)
    } finally {
      generatingRef.current.delete(connectionId)
      setGeneratingEdgeId(null)
    }
  }, [connections, scenes, characters, conflicts, activeProject, aiSettings])

  // ---------------------------------------------------------------------------
  // Select conflict option
  // ---------------------------------------------------------------------------
  const handleSelectOption = useCallback(async (conflictId: string, optionId: number) => {
    const { data, error } = await supabase.from('conflicts').update({ selected_option: optionId }).eq('id', conflictId).select().single()
    if (!error && data) setConflicts(prev => prev.map(c => c.id === conflictId ? data : c))
  }, [])

  // ---------------------------------------------------------------------------
  // Characters CRUD
  // ---------------------------------------------------------------------------
  const addCharacter = async (charData: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('characters').insert(charData).select().single()
    if (!error && data) setCharacters(prev => [...prev, data])
  }

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    const { data, error } = await supabase.from('characters').update(updates).eq('id', id).select().single()
    if (!error && data) setCharacters(prev => prev.map(c => c.id === id ? data : c))
  }

  const deleteCharacter = async (id: string) => {
    await supabase.from('characters').delete().eq('id', id)
    setCharacters(prev => prev.filter(c => c.id !== id))
  }

  // ---------------------------------------------------------------------------
  // Projects CRUD
  // ---------------------------------------------------------------------------
  const createProject = async () => {
    if (!newProjectName.trim()) return
    const { data, error } = await supabase.from('projects').insert({ name: newProjectName.trim() }).select().single()
    if (!error && data) {
      setProjects(prev => [data, ...prev])
      setActiveProject(data)
      setShowNewProject(false)
      setNewProjectName('')
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🐉</div>
          <div style={{ color: 'var(--accent)', fontSize: 14 }}>Loading Hydra Story Maker...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* ── Top Bar ── */}
      <div style={{
        height: 52, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <span style={{ fontSize: 20 }}>🐉</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>Hydra</span>
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: -4 }}>Story Maker</span>
        </div>

        {/* Project Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, overflowX: 'auto', paddingBottom: 2 }}>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p)}
              style={{
                background: activeProject?.id === p.id ? 'var(--surface2)' : 'transparent',
                border: `1px solid ${activeProject?.id === p.id ? 'var(--border)' : 'transparent'}`,
                borderRadius: 7, padding: '5px 12px', cursor: 'pointer',
                color: activeProject?.id === p.id ? 'var(--text)' : 'var(--muted)',
                fontSize: 13, fontWeight: activeProject?.id === p.id ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => setShowNewProject(true)}
            style={{
              background: 'transparent', border: '1px dashed var(--border)', borderRadius: 7,
              padding: '5px 10px', cursor: 'pointer', color: 'var(--muted)', fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            + Project
          </button>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {activeProject && (
            <button
              onClick={addScene}
              style={{
                background: 'var(--accent)', border: 'none', borderRadius: 8,
                padding: '7px 14px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              + Scene
            </button>
          )}
          <button
            onClick={() => setShowSide(p => !p)}
            style={{
              background: showSide ? 'var(--surface2)' : 'transparent',
              border: '1px solid var(--border)', borderRadius: 8,
              padding: '7px 12px', color: 'var(--text)', cursor: 'pointer', fontSize: 13,
            }}
            title="Toggle side panel"
          >
            {showSide ? '⇥' : '⇤'}
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          {activeProject ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              deleteKeyCode="Delete"
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
              <Controls />
              <MiniMap
                nodeColor={n => n.type === 'conflict' ? '#a78bfa' : '#6c8eff'}
                maskColor="rgba(15,17,23,0.7)"
              />
              <Panel position="top-left" style={{ marginTop: 0 }}>
                <div style={{
                  background: 'rgba(26,29,39,0.9)', backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  padding: '6px 12px', fontSize: 11, color: 'var(--muted)',
                }}>
                  {scenes.length} scenes · {connections.length} connections · {conflicts.length} conflicts
                </div>
              </Panel>
            </ReactFlow>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center', maxWidth: 400 }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>🐉</div>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Hydra Story Maker
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
                  Build complex, multi-dimensional stories with node-based scenes and AI-generated conflicts.
                </p>
                <button
                  onClick={() => setShowNewProject(true)}
                  style={{
                    background: 'var(--accent)', border: 'none', borderRadius: 10,
                    padding: '12px 28px', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700,
                  }}
                >
                  Create First Project
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        {showSide && (
          <div style={{
            width: 300, borderLeft: '1px solid var(--border)', background: 'var(--surface)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              {(['characters', 'settings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSideTab(tab)}
                  style={{
                    flex: 1, background: sideTab === tab ? 'var(--surface2)' : 'transparent',
                    border: 'none', borderBottom: sideTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                    padding: '11px 0', cursor: 'pointer',
                    color: sideTab === tab ? 'var(--text)' : 'var(--muted)',
                    fontSize: 12, fontWeight: sideTab === tab ? 600 : 400,
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'characters' ? '👤 Characters' : '⚙️ Settings'}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              {sideTab === 'characters' && activeProject && (
                <CharacterPanel
                  projectId={activeProject.id}
                  characters={characters}
                  onAdd={addCharacter}
                  onUpdate={updateCharacter}
                  onDelete={deleteCharacter}
                />
              )}
              {sideTab === 'settings' && (
                <SettingsPanel
                  settings={aiSettings}
                  onSave={s => { setAISettings(s); saveAISettings(s) }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Scene Editor Modal ── */}
      {editingScene && (
        <SceneEditor
          scene={editingScene}
          characters={characters}
          onSave={data => updateScene(editingScene.id, data)}
          onClose={() => setEditingScene(null)}
          onDelete={deleteScene}
        />
      )}

      {/* ── New Project Modal ── */}
      {showNewProject && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewProject(false) }}
        >
          <div className="fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>🐉 New Story Project</h2>
            <input
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createProject()}
              placeholder="Project name..."
              autoFocus
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowNewProject(false)} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={createProject} style={{ flex: 2, background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '10px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
