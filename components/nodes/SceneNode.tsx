'use client'
import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Character } from '@/types'

export interface SceneNodeData {
  id: string
  title: string
  description?: string
  character_ids?: string[]
  characters: Character[]
  onEdit: (id: string) => void
}

function SceneNode({ data, selected }: NodeProps) {
  const d = data as unknown as SceneNodeData
  const assignedChars = (d.character_ids || [])
    .map(id => d.characters?.find((c: Character) => c.id === id))
    .filter(Boolean) as Character[]

  return (
    <div
      className="relative"
      style={{
        background: 'var(--surface)',
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 12,
        minWidth: 220,
        maxWidth: 280,
        boxShadow: selected
          ? '0 0 0 3px rgba(108,142,255,0.2), 0 4px 24px rgba(0,0,0,0.4)'
          : '0 2px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'var(--surface2)',
          borderBottom: '1px solid var(--border)',
          borderRadius: '10px 10px 0 0',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🎬</span>
          <span
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 150,
            }}
          >
            {d.title || 'Untitled Scene'}
          </span>
        </div>
        <button
          onClick={() => d.onEdit(d.id)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: 14,
            padding: '2px 4px',
            borderRadius: 4,
            lineHeight: 1,
          }}
          title="Edit scene"
        >
          ✋️
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px' }}>
        {d.description ? (
          <p
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              margin: 0,
              lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {d.description}
          </p>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--border)', margin: 0, fontStyle: 'italic' }}>
            No description yet...
          </p>
        )}

        {/* Characters */}
        {assignedChars.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {assignedChars.map(char => (
              <span
                key={char.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: `${char.avatar_color}22`,
                  border: `1px solid ${char.avatar_color}55`,
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontSize: 11,
                  color: char.avatar_color,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: char.avatar_color,
                    display: 'inline-block',
                  }}
                />
                {char.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'var(--accent)',
          border: '2px solid var(--surface)',
          width: 10,
          height: 10,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'var(--accent)',
          border: '2px solid var(--surface)',
          width: 10,
          height: 10,
        }}
      />
    </div>
  )
}

export default memo(SceneNode)
