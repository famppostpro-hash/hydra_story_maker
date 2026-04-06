'use client'
import { useState, useEffect } from 'react'
import { Scene, Character } from '@/types'

interface SceneEditorProps {
  scene: Scene | null
  characters: Character[]
  onSave: (data: Partial<Scene>) => void
  onClose: () => void
  onDelete: (id: string) => void
}

export default function SceneEditor({ scene, characters, onSave, onClose, onDelete }: SceneEditorProps) {
  const [title, setTitle] = useState(scene?.title || '')
  const [description, setDescription] = useState(scene?.description || '')
  const [selectedChars, setSelectedChars] = useState<string[]>(scene?.character_ids || [])

  useEffect(() => {
    setTitle(scene?.title || '')
    setDescription(scene?.description || '')
    setSelectedChars(scene?.character_ids || [])
  }, [scene])

  if (!scene) return null

  const toggleChar = (id: string) => {
    setSelectedChars(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const handleSave = () => {
    onSave({ title, description, character_ids: selectedChars })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="fade-in"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
          width: 480,
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🎬 Edit Scene</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18 }}
          >×</button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
            SCENE TITLE
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter scene title..."
            style={{
              width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
            DESCRIPTION
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what happens in this scene..."
            rows={5}
            style={{
              width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 14,
              outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
            }}
          />
        </div>

        {/* Characters */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
            CHARACTERS IN SCENE
          </label>
          {characters.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
              No characters yet — add them in the Characters tab
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {characters.map(char => {
                const active = selectedChars.includes(char.id)
                return (
                  <button
                    key={char.id}
                    onClick={() => toggleChar(char.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: active ? `${char.avatar_color}22` : 'var(--surface2)',
                      border: `1px solid ${active ? char.avatar_color : 'var(--border)'}`,
                      borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
                      color: active ? char.avatar_color : 'var(--muted)',
                      fontSize: 12, fontWeight: active ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: char.avatar_color }} />
                    {char.name}
                    {active && <span style={{ fontSize: 10 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <button
            onClick={() => { onDelete(scene.id); onClose() }}
            style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 8, padding: '9px 16px', color: 'var(--error)', cursor: 'pointer', fontSize: 13,
            }}
          >
            🗑 Delete Scene
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '9px 16px', color: 'var(--muted)', cursor: 'pointer', fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                background: 'var(--accent)', border: 'none',
                borderRadius: 8, padding: '9px 20px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              Save Scene
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
