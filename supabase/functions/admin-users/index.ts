import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Non autorisé' }, 401)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // Verify caller and require admin role
    const { data: { user }, error: authErr } = await admin.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (authErr || !user) return json({ error: 'Non autorisé' }, 401)

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return json({ error: 'Accès refusé' }, 403)

    const { action, ...body } = await req.json()

    if (action === 'create') {
      const { email, password, full_name, role } = body
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name, role },
        email_confirm: true,
      })
      if (error) return json({ error: error.message }, 400)
      return json({ data })
    }

    if (action === 'update-password') {
      const { user_id, password } = body
      const { error } = await admin.auth.admin.updateUserById(user_id, { password })
      if (error) return json({ error: error.message }, 400)
      return json({ success: true })
    }

    if (action === 'delete') {
      const { user_id } = body
      const { error } = await admin.auth.admin.deleteUser(user_id)
      if (error) return json({ error: error.message }, 400)
      return json({ success: true })
    }

    if (action === 'signout') {
      const { user_id } = body
      const { error } = await admin.rpc('delete_user_sessions', { p_user_id: user_id })
      if (error) return json({ error: error.message }, 400)
      return json({ success: true })
    }

    return json({ error: 'Action inconnue' }, 400)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
