const SUPABASE_ENV_KEYS = Object.freeze(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

export async function createSupabaseClientFromEnv(options = {}) {
  const env = options.env ?? process.env;
  const dryRun = options.dryRun !== false;
  const missingEnv = SUPABASE_ENV_KEYS.filter((key) => !hasValue(env[key]));

  if (dryRun) {
    return createDisabledClient("disabled_dry_run", "Supabase client disabled because dry-run mode is active.", {
      missingEnv
    });
  }

  if (missingEnv.length > 0) {
    return createDisabledClient("env_missing", "Supabase client disabled because required environment variables are missing.", {
      missingEnv
    });
  }

  let module;

  try {
    module = await import("@supabase/supabase-js");
  } catch {
    return createDisabledClient(
      "dependency_missing",
      "Supabase client disabled because @supabase/supabase-js is not available.",
      {
        missingEnv: []
      }
    );
  }

  return {
    enabled: true,
    canWrite: true,
    status: "ready",
    reason: "Supabase client is ready for future server-side writes.",
    missingEnv: [],
    client: module.createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  };
}

export function getSupabaseEnvKeys() {
  return [...SUPABASE_ENV_KEYS];
}

function createDisabledClient(status, reason, details = {}) {
  return {
    enabled: false,
    canWrite: false,
    status,
    reason,
    missingEnv: details.missingEnv ?? [],
    client: null
  };
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}
