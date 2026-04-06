'use client'
import { useState } from 'react'
import { Character } from '@/types'

const AVATAR_COLORS = [
  '#6c8eff', '#a78bfa', '#34d399', '#f59e0b', '#f87171',
  '#38bdf8', '#fb7185', '#4ade80', '#facc15', '#c084fc',
]

interface CharacterPanelProps {
  projectId: string
  characters: Character[]
  onAdd: (data: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => void
  onUpdate: (id: string, data: Partial<Character>) => void
  onDelete: (id: string) => void
}

interface CharForm {
  name: string
  role: string
  background: string
  motivation: string
  traits: string
  avatar_color: string
}

const emptyForm: CharForm = {
  name: '', role: '', background: '', motivation: '', traits: '', avatar_color: AVATAR_COLORS[0],
}

export default function CharacterPanel({ projectId, characters, onAdd, onUpdate, onDelete }: CharacterPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CharForm>(emptyForm)

  const handleSubmit = () => {
    if (!form.name.trim()) return
    const traitsArr = form.traits.split(',').map(t => t.trim()).filter(Boolean)
    const data = {
      project_id: projectId,
      name: form.name.trim(),
      role: form.role.trim() || undefined,
      background: form.background.trim() || undefined,
      motivation: form.motivation.trim() || undefined,
      traits: traitsArr,
      avatar_color: form.avatar_color,
    }
    if (editingId) {
      onUpdate(editingId, data)
    } else {
      onAdd(data as Omit<Character, 'id' | 'created_at' | 'updated_at'>)
    }
    setForm(emptyForm)
    setShowForm(false)
    setEditingId(null)
  }

  const startEdit = (c: Character) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      role: c.role || '',
      background: c.background || '',
      motivation: c.motivation || '',
      traits: (c.traits || []).join(', '),
      avatar_color: c.avatar_color,
    })
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>👤 Characters</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>{characters.length} persona{characters.length !== 1 ? 's' : ''}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: 'var(--accent)', border: 'none', borderRadius: 8,
              padding: '7px 14px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            + New
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Form */}
        {showForm && (
          <div
            className="fade-in"
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 16, marginBottom: 16,
            }}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
              {editingId ? 'Edit Character' : '✦ New Character'}
            </h3>

            <Field label="NAME *">
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Character name" style={inputStyle} />
            </Field>
            <Field label="ROLE / ARCHETYPE">
              <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Protagonist, Mentor, Antagonist..." style={inputStyle} />
            </Field>
            <Field label="BACKGROUND">
              <textarea value={form.background} onChange={e => setForm(p => ({ ...p, background: e.target.value }))} placeholder="Character background and history..." rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </Field>
            <Field label="MOTIVATION">
              <input value={form.motivation} onChange={e => setForm(p => ({ ...p, motivation: e.target.value }))} placeholder="What does this character want?" style={inputStyle} />
            </Field>
            <Field label="TRAITS (comma separated)">
              <input value={form.traits} onChange={e => setForm(p => ({ ...p, traits: e.target.value }))} placeholder="e.g. brave, secretive, loyal..." style={inputStyle} />
            </Field>

            {/* Color picker */}
            <Field label="AVATAR COLOR">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setForm(p => ({ ...p, avatar_color: color }))}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer',
                      outline: form.avatar_color === color ? `3px solid ${color}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </Field>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={cancelForm} style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
              <button onClick={handleSubmit} style={{ ...btnPrimary, flex: 2 }}>
                {editingId ? 'Update' : 'Add Character'}
              </button>
            </div>
          </div>
        )}

        {/* Character list */}
        {characters.length === 0 && !showForm ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
            <p style={{ fontSize: 13, margin: 0 }}>No characters yet</p>
            <p style={{ fontSize: 12, margin: '4px 0 0', color: 'var(--border)' }}>Add personas to populate your scenes</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {characters.map(char => (
              <div
                key={char.id}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px 14px',
                  borderLeft: `3px solid ${char.avatar_color}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: char.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {char.name[0]?.toUpperCase()}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{char.name}</div>
                      {char.role && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{char.role}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEdit(char)} style={{ ...btnIcon }}>✏️</button>
                    <button onClick={() => onDelete(char.id)} style={{ ...btnIcon, color: 'var(--error)' }}>🗑</button>
                  </div>
                </div>
                {char.motivation && (
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', paddingLeft: 36 }}>
                    🎯 {char.motivation}
                  </div>
                )}
                {char.traits && char.traits.length > 0 && (
                  <div style={{ marginTop: 6, paddingLeft: 36, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {char.traits.map(t => (
                      <span key={t} style={{ fontSize: 10, background: `${char.avatar_color}18`, color: char.avatar_color, border: `1px solid ${char.avatar_color}33`, borderRadius: 10, padding: '1px 6px' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--muted)', marginBottom: 4, letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13,
  outline: 'none',
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--accent)', border: 'none', borderRadius: 7,
  padding: '9px 14px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
}

const btnSecondary: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7,
  padding: '9px 14px', color: 'var(--muted)', cursor: 'pointer', fontSize: 13,
}

const btnIcon: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--muted)', fontSize: 13, padding: '3px 5px', borderRadius: 5,
}
