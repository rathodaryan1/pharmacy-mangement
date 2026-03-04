type SupabaseAuthConfig = {
  url: string;
  apiKey: string;
  redirectTo?: string;
};

function deriveSupabaseUrlFromDb(): string | null {
  const directUrl = process.env.DIRECT_URL ?? "";
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const source = directUrl || databaseUrl;
  if (!source) return null;

  const refFromDirect = source.match(/db\.([a-z0-9]+)\.supabase\.co/i)?.[1];
  if (refFromDirect) return `https://${refFromDirect}.supabase.co`;

  const refFromPooler = source.match(/postgres\.([a-z0-9]+)\.pooler\.supabase\.com/i)?.[1];
  if (refFromPooler) return `https://${refFromPooler}.supabase.co`;

  return null;
}

function getSupabaseAuthConfig(): SupabaseAuthConfig {
  const url = process.env.SUPABASE_URL ?? deriveSupabaseUrlFromDb();
  const apiKey = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const redirectTo = process.env.SUPABASE_MAGIC_LINK_REDIRECT_TO;

  if (!url) {
    throw new Error("Supabase URL is not configured. Set SUPABASE_URL.");
  }
  if (!apiKey) {
    throw new Error("Supabase API key is not configured. Set SUPABASE_ANON_KEY.");
  }

  return { url, apiKey, redirectTo };
}

async function supabaseAuthRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const cfg = getSupabaseAuthConfig();
  const response = await fetch(`${cfg.url}${path}`, {
    method: "POST",
    headers: {
      apikey: cfg.apiKey,
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = raw || `Supabase auth request failed (${response.status})`;
    try {
      const parsed = JSON.parse(raw) as { error_description?: string; msg?: string; message?: string };
      message = parsed.error_description ?? parsed.msg ?? parsed.message ?? message;
    } catch {}
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function sendSupabaseLoginOtp(email: string): Promise<void> {
  const cfg = getSupabaseAuthConfig();
  const payload: Record<string, unknown> = {
    email,
    create_user: false,
  };
  if (cfg.redirectTo) {
    payload.email_redirect_to = cfg.redirectTo;
  }
  await supabaseAuthRequest("/auth/v1/otp", payload);
}

export async function verifySupabaseEmailOtp(email: string, token: string): Promise<void> {
  await supabaseAuthRequest("/auth/v1/verify", {
    type: "email",
    email,
    token,
  });
}
