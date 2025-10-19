/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_SERVICE_URL: string;
  readonly VITE_EVENT_SERVICE_URL: string;
  readonly VITE_TICKET_SERVICE_URL: string;
  readonly VITE_PAYMENT_SERVICE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
