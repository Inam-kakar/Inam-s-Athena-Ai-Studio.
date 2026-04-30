import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';

// Next.js 15 requires PageProps to have params as a Promise
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudioPage({ params }: PageProps) {
  // 1. Await the params (Required in Next.js 15)
  const { id } = await params;

  // 2. Initialize Supabase
  const supabase = await createClient();

  // 3. Check for Authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 4. Fetch the Project/Agent data
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  // If project doesn't exist or doesn't belong to the user, 404
  if (error || !project || project.user_id !== user.id) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Studio Header */}
      <header className="glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">
            <i className="fas fa-microchip text-accent-blue"></i>
          </div>
          <div>
            <h1 className="text-sm font-semibold">{project.name || 'Untitled Agent'}</h1>
            <p className="text-xs text-gray-500">Agent Studio • ID: {id.slice(0, 8)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="glass-panel px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/5 transition-colors">
            <i className="fas fa-play mr-2"></i> Test Agent
          </button>
          <button className="bg-accent-blue hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Deploy
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="h-[calc(100vh-73px)] relative grid-bg overflow-hidden">
        {/* This is where your Flow/Canvas component would go */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-20">
            <i className="fas fa-project-diagram text-6xl mb-4"></i>
            <p className="text-lg font-light">Agent Forge Canvas</p>
          </div>
        </div>
        
        {/* Placeholder for Node Data */}
        <div className="absolute bottom-6 left-6 glass-panel p-4 rounded-xl border border-white/10 max-w-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Project Stats</h3>
          <div className="space-y-1">
            <p className="text-sm">Status: <span className="text-green-400">Ready</span></p>
            <p className="text-sm">Nodes: {project.nodes?.length || 0}</p>
          </div>
        </div>
      </main>
    </div>
  );
}