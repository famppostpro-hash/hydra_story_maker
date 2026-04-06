'use client'
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react'

export interface ConflictEdgeData {
  connectionId: string
  label?: string
  isGenerating?: boolean
  hasConflict?: boolean
  onGenerate: (connectionId: string) => void
}

export default function ConflictEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const d = data as unknown as ConflictEdgeData
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: d?.hasConflict ? 'var(--accent2)' : 'var(--accent)',
          strokeWidth: selected ? 2.5 : 2,
          opacity: selected ? 1 : 0.7,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {d?.isGenerating ? (
            <div
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--accent)',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 11,
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  border: '2px solid var(--accent)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Generating...
            </div>
          ) : d?.hasConflict ? (
            <button
              onClick={() => d.onGenerate(d.connectionId)}
              style={{
                background: 'rgba(167,139,250,0.15)',
                border: '1px solid var(--accent2)',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 11,
                color: 'var(--accent2)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Regenerate conflicts"
            >
              ⚠ Conflict — Regen
            </button>
          ) : (
            <button
              onClick={() => d.onGenerate(d.connectionId)}
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 11,
                color: 'var(--muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = 'var(--accent)'
                el.style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = 'var(--border)'
                el.style.color = 'var(--muted)'
              }}
              title="Generate AI conflict"
            >
              ✦ Gen Conflict
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
