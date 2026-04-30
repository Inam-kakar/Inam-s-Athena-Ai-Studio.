import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';

/**
 * Next.js 15 Type Requirement:
 * Params and SearchParams MUST be defined as Promises.
 */
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StudioPage({ params, searchParams }: PageProps) {
  // 1. Await both params and searchParams to satisfy the compiler
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  // 2. Initialize Supabase
  const supabase = await createClient();

  // 3. Authenticate the user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 4. Fetch the agent project data
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  // Security: Check if project exists and belongs to the user
  if (error || !project || project.user_id !== user.id) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Studio Navigation Header */}
      <header className="border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <i className="fas fa-brain text-blue-400"></i>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              {project.name || 'Untitled Agent'}
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase font-mono">
              Forge Studio • {id.slice(0, 8)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg text-xs font-medium border border-white/10 hover:bg-white/5 transition-all">
            Share
          </button>
          <button className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20">
            Deploy Agent
          </button>
        </div>
      </header>

      {/* Studio Workspace Canvas */}
      <main className="h-[calc(100vh-73px)] relative overflow-hidden bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="text-center">
            <i className="fas fa-project-diagram text-8xl mb-6"></i>
            <h2 className="text-2xl font-bold tracking-tighter">Forge Canvas</h2>
          </div>
        </div>

        {/* Floating Info Panel */}
        <div className="absolute bottom-8 left-8 p-5 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/5 w-64 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase text-zinc-400">Live Connection</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Nodes Configured</span>
              <span className="text-xs font-mono">{project.nodes?.length || 0}</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-2/3"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}