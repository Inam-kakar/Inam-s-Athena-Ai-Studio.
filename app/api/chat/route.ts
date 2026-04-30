import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// POST: Share a project
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15 fix: params is now a Promise
) {
  // 1. Await the dynamic parameters
  const { id } = await params;
  
  // 2. Initialize Supabase
  const supabase = await createClient();

  // 3. Authenticate User
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 4. Get request body
    const { permission } = await req.json();

    // 5. Database Interaction
    const { data, error } = await supabase
      .from('project_shares')
      .insert({ 
        project_id: id, 
        user_id: user.id, 
        permission 
      })
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

// DELETE: Unshare a project
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15 fix
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('project_shares')
    .delete()
    .match({ project_id: id, user_id: user.id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Project unshared successfully' });
}