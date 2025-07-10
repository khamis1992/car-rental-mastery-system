/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
  readonly VITE_APP_ENV: string
  readonly VITE_SADAD_API_URL: string
  readonly VITE_SADAD_MERCHANT_ID: string
  readonly VITE_SADAD_MERCHANT_KEY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_OPENAI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
