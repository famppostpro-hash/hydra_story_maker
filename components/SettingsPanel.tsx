'use client'
import { useState } from 'react'

export interface AISettings {
  endpoint: string
  model: string
}

interface SettingsPanelProps {
  settings: AISettings
  onSave: (s: AISettings) => void
}

export default function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [endpoint, setEndpoint] = useState(settings.endpoint)
  const [model, setModel] = useState(settings.model)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleSave = () => {
    onSave({ endpoint: endpoint.trim(), model: model.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${endpoint.trim()}/v1/models`)
      if (res.ok) {
        const data = await res.json()
        const models = data.data?.map((m: { id: string }) => m.id).join(', ') || 'unknown'
        setTestResult(`✅ Connected! Models: ${models}`)
      } else {
        setTestResult(`❌ Error: ${res.status} ${res.statusText}`)
      }
    } catch (e) {
      setTestResult(`❌ Cannot connect to ${endpoint} — is LM Studio running?`)
    }
    setTesting(false)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>⚙️ AI Settings</h2>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>Configure LM Studio connection</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>LM Studio / OpenAI-compatible API</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.05em' }}>
              API ENDPOINT
            </label>
            <input
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              placeholder="http://localhost:1234"
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
            />
            <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--muted)' }}>
              Default LM Studio port is 1234. Will call /v1/chat/completions
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.05em' }}>
              MODEL NAME
            </label>
            <input
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="e.g. gemma-3-4b-it-qat"
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none' }}
            />
          </div>

          {testResult && (
            <div style={{
              marginBottom: 14, padding: '9px 12px', borderRadius: 7, fontSize: 12,
              background: testResult.startsWith('✅') ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${testResult.startsWith('✅') ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
              color: testResult.startsWith('✅') ? 'var(--success)' : 'var(--error)',
            }}>
              {testResult}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={testConnection}
              disabled={testing}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7,
                padding: '9px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: 13, flex: 1,
              }}
            >
              {testing ? '⟳ Testing...' : '⚡ Test Connection'}
            </button>
            <button
              onClick={handleSave}
              style={{
                background: saved ? 'var(--success)' : 'var(--accent)', border: 'none', borderRadius: 7,
                padding: '9px 14px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, flex: 1,
              }}
            >
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div style={{ background: 'rgba(108,142,255,0.05)', border: '1px solid rgba(108,142,255,0.15)', borderRadius: 10, padding: 14 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--accent)' }}>💡 How it works</h4>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
            <li>Connect two Scene nodes with an edge</li>
            <li>Click <strong style={{ color: 'var(--text)' }}>✦ Gen Conflict</strong> on the edge label</li>
            <li>AI generates 3 conflict options between the scenes</li>
            <li>Select the best option — it saves to the story</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
