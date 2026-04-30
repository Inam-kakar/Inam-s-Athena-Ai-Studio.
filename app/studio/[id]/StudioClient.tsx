'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CollaborationManager } from '@/lib/supabase-realtime'

export default function StudioClient({ project, userId, userEmail }: { project: any; userId: string; userEmail: string }) {
  const [nodes, setNodes] = useState(project.nodes || [])
  const [connections, setConnections] = useState(project.connections || [])
  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const [cursors, setCursors] = useState<Record<string, any>>({})
  const [showShare, setShowShare] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [permission, setPermission] = useState('view')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const collabRef = useRef<any>(null)

  useEffect(() => {
    const manager = new CollaborationManager(
      project.id,
      userId,
      userEmail,
      (update: any) => {
        if (update.nodes) setNodes(update.nodes)
        if (update.connections) setConnections(update.connections)
      },
      (users: any[]) => setActiveUsers(users.filter((u: any) => u.user_id !== userId))
    )

    collabRef.current = manager
    manager.join()

    const channel = (manager as any).channel
    channel?.on('broadcast', { event: 'cursor_move' }, (payload: any) => {
      if (payload.payload.user_id !== userId) {
        setCursors((prev: any) => ({
          ...prev,
          [payload.payload.user_id]: payload.payload
        }))
      }
    })

    return () => manager.leave()
  }, [project.id, userId, userEmail])

  const saveProject = useCallback(
    debounce(async (newNodes: any[], newConnections: any[]) => {
      await collabRef.current?.updateProject({ nodes: newNodes, connections: newConnections })
    }, 500),
    []
  )

  const handleNodeMove = (nodeId: string, x: number, y: number) => {
    const newNodes = nodes.map((n: any) => n.id === nodeId ? { ...n, x, y } : n)
    setNodes(newNodes)
    saveProject(newNodes, connections)
  }

  const handleAddNode = (type: string, data: any, x: number, y: number) => {
    const newNode = { id: `node_${Date.now()}`, type, data, x, y }
    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    saveProject(newNodes, connections)
  }

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMsg = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...chatMessages, userMsg],
        provider: selectedProvider,
        model: selectedModel,
      }),
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let aiResponse = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        aiResponse += decoder.decode(value)
      }
    }

    setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
    setChatLoading(false)
  }

  const createShare = async () => {
    const res = await fetch(`/api/projects/${project.id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission }),
    })
    const data = await res.json()
    setShareUrl(`${window.location.origin}/shared/${data.token}`)
  }

  return (
    <div className="h-screen flex flex-col bg-dark-900">
      <div className="glass-panel border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-cube text-accent-blue"></i>
            <span className="text-white font-semibold">{project.name}</span>
          </div>
          <div className="flex -space-x-2">
            {activeUsers.map((u: any, i: number) => (
              <div key={u.user_id} className="w-7 h-7 rounded-full border-2 border-dark-900 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: u.color, zIndex: activeUsers.length - i }}>
                {u.email?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowShare(true)} className="glass-panel px-3 py-1.5 rounded-lg text-sm text-white border border-white/10 hover:bg-white/5">
            <i className="fas fa-share-alt mr-1"></i> Share
          </button>
          <button onClick={() => setChatOpen(!chatOpen)} className="bg-accent-blue px-3 py-1.5 rounded-lg text-sm text-white hover:bg-blue-600">
            <i className="fas fa-play mr-1"></i> Test
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-60 glass-panel border-r border-white/5 flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Components</h3>
          </div>
          <div className="p-3 space-y-2">
            {[
              { type: 'model', provider: 'openai', name: 'GPT-4o', icon: 'fa-sparkles', color: 'text-green-400', bg: 'bg-green-500/10' },
              { type: 'model', provider: 'gemini', name: 'Gemini 2.5 Pro', icon: 'fa-gem', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { type: 'model', provider: 'anthropic', name: 'Claude 3.7', icon: 'fa-fire', color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { type: 'tool', tool: 'web-search', name: 'Web Search', icon: 'fa-search', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { type: 'tool', tool: 'code-exec', name: 'Code Executor', icon: 'fa-code', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { type: 'memory', memory: 'buffer', name: 'Buffer Memory', icon: 'fa-comment-dots', color: 'text-pink-400', bg: 'bg-pink-500/10' },
            ].map((item) => (
              <div
                key={item.name}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('type', item.type)
                  e.dataTransfer.setData('data', JSON.stringify(item))
                }}
                className="bg-dark-800 border border-white/5 rounded-lg p-2.5 cursor-move hover:border-accent-blue/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded ${item.bg} flex items-center justify-center`}>
                    <i className={`fas ${item.icon} ${item.color} text-xs`}></i>
                  </div>
                  <span className="text-sm text-gray-200">{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex-1 relative overflow-hidden grid-bg"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const type = e.dataTransfer.getData('type')
            const data = JSON.parse(e.dataTransfer.getData('data'))
            const rect = e.currentTarget.getBoundingClientRect()
            handleAddNode(type, data, e.clientX - rect.left, e.clientY - rect.top)
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {connections.map((c: any, i: number) => (
              <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
            ))}
          </svg>

          {nodes.map((node: any) => (
            <DraggableNode key={node.id} node={node} onMove={handleNodeMove} />
          ))}

          {Object.entries(cursors).map(([id, cursor]: [string, any]) => (
            <div key={id} className="absolute pointer-events-none z-50 transition-all duration-100" style={{ left: cursor.x, top: cursor.y }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={cursor.color}>
                <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L11.7841 12.3673H5.65376Z" fill={cursor.color} stroke="white" strokeWidth="1" />
              </svg>
              <span className="absolute left-4 top-4 px-1.5 py-0.5 rounded text-[10px] text-white whitespace-nowrap" style={{ backgroundColor: cursor.color }}>
                Guest
              </span>
            </div>
          ))}
        </div>

        {chatOpen && (
          <div className="w-80 glass-panel border-l border-white/5 flex flex-col">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-medium text-white">Test Agent</span>
              <button onClick={() => setChatOpen(false)} className="text-gray-500"><i className="fas fa-times"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.map((m, i) => (
                <div key={i} className={`p-2 rounded text-xs ${m.role === 'user' ? 'bg-blue-500/10 text-blue-200' : 'bg-green-500/10 text-green-200'}`}>
                  <span className="font-semibold">{m.role}:</span> {m.content}
                </div>
              ))}
              {chatLoading && <div className="text-gray-500 text-xs">Thinking...</div>}
            </div>
            <div className="p-3 border-t border-white/5">
              <form onSubmit={handleChat} className="flex gap-2">
                <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)} className="bg-dark-800 border border-white/10 rounded text-xs text-white px-2">
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Gemini</option>
                  <option value="anthropic">Anthropic</option>
                </select>
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Test..." className="flex-1 bg-dark-800 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                <button type="submit" className="bg-accent-blue text-white px-2 py-1 rounded text-xs"><i className="fas fa-paper-plane"></i></button>
              </form>
            </div>
          </div>
        )}
      </div>

      {showShare && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShare(false)} />
          <div className="relative glass-panel rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Share Project</h3>
            {!shareUrl ? (
              <div className="space-y-3">
                <select value={permission} onChange={(e) => setPermission(e.target.value)} className="w-full bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="view">View Only</option>
                  <option value="clone">View & Clone</option>
                  <option value="edit">Collaborate</option>
                </select>
                <button onClick={createShare} className="w-full bg-accent-blue text-white py-2 rounded-lg text-sm">Generate Link</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input value={shareUrl} readOnly className="flex-1 bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300" />
                  <button onClick={() => navigator.clipboard.writeText(shareUrl)} className="bg-white/5 text-white px-3 py-2 rounded-lg text-sm">Copy</button>
                </div>
                <button onClick={() => setShareUrl('')} className="w-full text-red-400 text-sm">Revoke</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function debounce(fn: Function, ms: number) {
  let timer: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

function DraggableNode({ node, onMove }: { node: any; onMove: (id: string, x: number, y: number) => void }) {
  const [pos, setPos] = useState({ x: node.x, y: node.y })

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX - pos.x
    const startY = e.clientY - pos.y

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX
      const newY = e.clientY - startY
      setPos({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      onMove(node.id, pos.x, pos.y)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      className="absolute bg-dark-800 border border-white/10 rounded-xl p-3 w-56 shadow-lg cursor-move hover:border-accent-blue/30"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center">
          <i className="fas fa-cube text-accent-blue text-xs"></i>
        </div>
        <div>
          <p className="text-sm font-medium text-white">{node.data.name || node.type}</p>
          <p className="text-xs text-gray-500">{node.data.provider || node.data.tool || node.data.memory}</p>
        </div>
      </div>
    </div>
  )
}
