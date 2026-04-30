'use client'

import { createClient } from '@supabase/supabase-js'
import { RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const realtimeClient = createClient(supabaseUrl, supabaseKey, {
  realtime: { params: { eventsPerSecond: 10 } }
})

const USER_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ec4899', '#ef4444', '#84cc16'
]

export function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

export class CollaborationManager {
  private channel: RealtimeChannel | null = null

  constructor(
    private projectId: string,
    private userId: string,
    private userEmail: string,
    private onUpdate: (payload: any) => void,
    private onPresence: (users: any[]) => void
  ) {}

  async join() {
    this.channel = realtimeClient
      .channel(`project:${this.projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${this.projectId}`,
        },
        (payload) => {
          this.onUpdate(payload.new)
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel!.track({
            user_id: this.userId,
            user_email: this.userEmail,
            color: getUserColor(this.userId),
            online_at: new Date().toISOString(),
          })
        }
      })

    const presenceChannel = realtimeClient.channel(`presence:${this.projectId}`)

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const users = Object.values(state).flat().map((p: any) => ({
          user_id: p.user_id,
          email: p.user_email,
          color: p.color,
        }))
        this.onPresence(users)
      })
      .subscribe()

    document.addEventListener('mousemove', (e) => {
      this.channel?.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          user_id: this.userId,
          x: e.clientX,
          y: e.clientY,
          color: getUserColor(this.userId),
        },
      })
    })
  }

  async updateProject(updates: Partial<any>) {
    await realtimeClient
      .from('projects')
      .update(updates)
      .eq('id', this.projectId)
  }

  leave() {
    this.channel?.unsubscribe()
  }
}
