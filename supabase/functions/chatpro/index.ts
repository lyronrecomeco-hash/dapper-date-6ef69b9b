import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const serviceClient = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, config } = body;

    // Actions that don't need ChatPro config
    if (action === "save_config") {
      const { instance_id, token, endpoint } = config || {};
      if (!instance_id || !token || !endpoint) {
        return new Response(JSON.stringify({ error: "Campos obrigatórios não preenchidos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert - delete all then insert (single config row)
      await serviceClient.from("chatpro_config").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error: insertErr } = await serviceClient.from("chatpro_config").insert({
        instance_id: instance_id.trim(),
        token: token.trim(),
        endpoint: endpoint.trim().replace(/\/$/, ""),
      });

      if (insertErr) {
        return new Response(JSON.stringify({ error: "Erro ao salvar: " + insertErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_config") {
      const { data: cfgRows } = await serviceClient
        .from("chatpro_config")
        .select("instance_id, endpoint, created_at, updated_at")
        .limit(1);

      const cfg = cfgRows?.[0] || null;
      return new Response(JSON.stringify({ config: cfg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For all other actions, load config
    const { data: cfgRows } = await serviceClient
      .from("chatpro_config")
      .select("*")
      .limit(1);

    const cfg = cfgRows?.[0];
    if (!cfg || !cfg.instance_id || !cfg.token) {
      return new Response(JSON.stringify({ error: "ChatPro não configurado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = `${cfg.endpoint}/${cfg.instance_id}/api/v1`;
    const chatproHeaders = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": cfg.token,
    };

    if (action === "test_connection" || action === "status") {
      const res = await fetch(`${baseUrl}/status`, { headers: chatproHeaders });
      const data = await res.json();
      return new Response(JSON.stringify({ status: res.status, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_qrcode") {
      const res = await fetch(`${baseUrl}/generate_qrcode`, { headers: chatproHeaders });
      const data = await res.json();
      return new Response(JSON.stringify({ status: res.status, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reload") {
      const res = await fetch(`${baseUrl}/reload`, {
        method: "GET",
        headers: chatproHeaders,
      });
      const data = await res.json();
      return new Response(JSON.stringify({ status: res.status, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "remove_session") {
      const res = await fetch(`${baseUrl}/remove_session`, {
        method: "GET",
        headers: chatproHeaders,
      });
      const data = await res.json();
      return new Response(JSON.stringify({ status: res.status, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ChatPro edge function error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
