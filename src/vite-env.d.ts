/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_RPC_HOST: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

