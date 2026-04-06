'use client'
import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { ConflictOption } from '@/types'

export interface ConflictNodeData {
  id: string
  options: ConflictOption[]
  selected_option: number | null
  onSelect: (conflictId: string, optionId: number) => void
}

function ConflictNode({ data, selected }: NodeProps) {
  const d = data as unknown as ConflictNodeData

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `2px solid ${selected ? 'var(--accent2)' : '#3d2f6e'}`,
        borderRadius: 12,
        minWidth: 300,
        maxWidth: 360,
        boxShadow: selected
          ? '0 0 0 3px rgba(167,139,250,0.2), 0 4px 24px rgba(0,0,0,0.5)'
          : '0 2px 16px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2d1f5e, #1f1a3d)',
          borderBottom: '1px solid #3d2f6e',
          borderRadius: '10px 10px 0 0',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>⚠</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent2)' }}>
          Conflict Options
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: '#7c6aaa',
            background: '#2d1f5e',
            padding: '2px 6px',
            borderRadius: 10,
          }}
        >
          AI Generated
        </span>
      </div>

      {/* Options */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {d.options.map((opt, i) => {
          const isSelected = d.selected_option === opt.id
          return (
            <div
              key={opt.id}
              onClick={() => d.onSelect(d.id, opt.id)}
              style={{
                background: isSelected ? 'rgba(167,139,250,0.12)' : 'var(--surface2)',
                border: `1px solid ${isSelected ? 'var(--accent2)' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: isSelected ? 'var(--accent2)' : 'var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: isSelected ? '#1a1d27' : 'var(--muted)',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      color: isSelected ? 'var(--accent2)' : 'var(--text)',
                      marginBottom: 4,
                    }}
                  >
                    {opt.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                    {opt.description}
                  </div>
                  {opt.tension && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 10,
                        color: '#f59e0b',
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 4,
                        padding: '3px 6px',
                      }}
                    >
                      ⚠ {opt.tension}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      </div>

      <Handle type="target" position={Position.Left} style={{ background: 'var(--accent2)', border: '2px solid var(--surface)', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: 'var(--accent2)', border: '2px solid var(--surface)', width: 10, height: 10 }} />
    </div>
  )
}

export default memo(ConflictNode)
