/// <reference types="vite/client" />

// Variables d'environnement exposées au front (préfixe VITE_), typées.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
