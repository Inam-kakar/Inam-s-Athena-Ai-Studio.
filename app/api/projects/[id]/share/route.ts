import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Next.js 15 requires awaiting params
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { permission } = await req.json();

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
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
} // <--- This bracket must correctly close the POST function

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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