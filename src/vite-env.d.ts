/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ENDPOINT: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_VERIFY_ENDPOINT: string
  readonly VITE_PUBLIC_TSA_BOARD_URL: string
  readonly VITE_GTM_ID: string
  readonly VITE_GA4_MEASUREMENT_ID: string
  readonly VITE_META_PIXEL_ID: string
  readonly VITE_TIKTOK_PIXEL_ID: string
  readonly VITE_RECAPTCHA_SITE_KEY: string
  readonly VITE_DEBUG_TRACKING: string
  readonly VITE_ENABLE_CONSOLE_LOGS: string
  readonly VITE_COGNITO_CLIENT_ID: string
  readonly VITE_COGNITO_DOMAIN: string
  readonly VITE_COGNITO_REDIRECT_URI: string
  readonly VITE_POST_LOGOUT_REDIRECT_URI: string
  readonly VITE_APP_BASE_URL: string
  readonly VITE_DONEAI_API_KEY: string
  readonly VITE_OAUTH_SCOPES: string
  readonly VITE_DEV_MODE: string
  readonly VITE_ENABLE_ENCRYPTED_WAITLIST: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_ENV__: string | Partial<ImportMetaEnv> | undefined;
declare const __DEV__: boolean;
