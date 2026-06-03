// Admin-only: insert in-app reminder + optional Resend email (24h debounce).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isAdmin, error: adminErr } = await userClient.rpc('is_admin');
    if (adminErr || !isAdmin) {
      return new Response(JSON.stringify({ error: 'not authorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: payment } = await admin
      .from('payments')
      .select('paid, last_reminder_at, reminder_count')
      .eq('user_id', userId)
      .maybeSingle();

    if (payment?.paid) {
      return new Response(JSON.stringify({ error: 'already paid' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    if (payment?.last_reminder_at) {
      const last = new Date(payment.last_reminder_at).getTime();
      if (Date.now() - last < 24 * 60 * 60 * 1000) {
        return new Response(JSON.stringify({ error: 'reminder sent within 24h' }), {
          status: 429,
          headers: { ...corsHeaders, 'content-type': 'application/json' },
        });
      }
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('email, display_name')
      .eq('id', userId)
      .single();

    const fee = Deno.env.get('ENTRY_FEE_SEK') || Deno.env.get('VITE_ENTRY_FEE_SEK') || '';
    const swish = Deno.env.get('SWISH_NUMBER') || Deno.env.get('VITE_SWISH_NUMBER') || '';
    const message = `Du är inte markerad som betald i VM-tipset. Swisha ${fee ? `${fee} kr` : 'avgiften'} till ${swish || 'Swish-numret'} och meddela arrangören.`;

    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const email = profile?.email || userData?.user?.email;

    const { data: callerData } = await userClient.auth.getUser();
    const sentBy = callerData?.user?.id ?? null;

    const { error: insertErr } = await admin.from('payment_reminders').insert({
      user_id: userId,
      message,
      sent_by: sentBy,
    });
    if (insertErr) throw insertErr;

    let emailSent = false;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('REMINDER_FROM_EMAIL');
    if (resendKey && fromEmail && email) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Påminnelse: VM-tipset — betalning',
          text: `Hej ${profile?.display_name || ''},\n\n${message}\n\n/Vänskapsmatcher`,
        }),
      });
      emailSent = res.ok;
    }

    await admin.from('payments').upsert(
      {
        user_id: userId,
        paid: false,
        reminder_count: (payment?.reminder_count ?? 0) + 1,
        last_reminder_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    return new Response(
      JSON.stringify({ ok: true, emailSent, hasEmail: Boolean(email) }),
      { headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
