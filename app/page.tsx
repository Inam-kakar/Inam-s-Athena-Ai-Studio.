'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data)
  }

  const createProject = async () => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProjectName,
        description: newProjectDesc,
        nodes: [],
        connections: [],
      }),
    })
    const data = await res.json()
    router.push(`/studio/${data.id}`)
  }

  const deleteProject = async (id: string) => {
    await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
    loadProjects()
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <nav className="glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white text-sm"></i>
          </div>
          <span className="text-xl font-bold text-white">AgentForge</span>
        </div>
        <button onClick={signOut} className="text-gray-400 hover:text-white text-sm">
          Sign Out
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">My Projects</h2>
            <p className="text-gray-400 text-sm">Manage and deploy your agentic workflows</p>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="glass-panel rounded-xl border border-white/5 p-5 hover:border-accent-blue/30 transition-all cursor-pointer"
              onClick={() => router.push(`/studio/${p.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center">
                  <i className="fas fa-cube text-accent-blue"></i>
                </div>
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  {p.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{p.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{p.description || 'No description'}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{p.nodes?.length || 0} nodes</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteProject(p.id) }}
                  className="text-red-400 hover:text-red-300"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showNewProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewProject(false)} />
          <div className="relative glass-panel rounded-2xl border border-white/10 p-6 w-full max-w-md modal-enter">
            <h3 className="text-lg font-semibold text-white mb-4">Create Project</h3>
            <div className="space-y-4">
              <input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2 text-white"
              />
              <textarea
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Description"
                className="w-full bg-dark-800 border border-white/10 rounded-lg px-4 py-2 text-white h-20 resize-none"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowNewProject(false)} className="text-gray-400 text-sm">Cancel</button>
                <button onClick={createProject} className="bg-accent-blue text-white px-4 py-2 rounded-lg text-sm">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
