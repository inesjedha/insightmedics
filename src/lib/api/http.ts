// Couche HTTP bas niveau : URL de l'API, en-têtes, gestion uniforme des erreurs.
// Les fonctions métier (client.ts) s'appuient sur `request` et ne manipulent jamais fetch.

const API_BASE_URL: string | undefined = import.meta.env.VITE_API_BASE_URL;

/** Erreur HTTP de l'API ; `message` est le `detail` renvoyé par le backend, lisible. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** 401 : clé admin absente ou invalide. */
export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, "Clé admin requise ou invalide");
    this.name = "UnauthorizedError";
  }
}

export function apiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL n'est pas défini (voir .env.example).");
  }
  return `${API_BASE_URL}${path}`;
}

// --- Clé admin : saisie dans l'espace admin, conservée dans le navigateur ---

const ADMIN_KEY_STORAGE = "im_admin_key";

export function getAdminKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
}

export function setAdminKey(key: string): void {
  window.localStorage.setItem(ADMIN_KEY_STORAGE, key.trim());
}

// --- Requêtes ---

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  /** Objet sérialisé en JSON, ou FormData envoyé tel quel (upload). */
  body?: unknown;
  /** Ajoute l'en-tête X-Admin-Key. */
  admin?: boolean;
}

async function errorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
  } catch {
    // Corps absent ou non JSON : message générique ci-dessous.
  }
  return `Erreur ${res.status}`;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, admin = false } = options;
  const headers: Record<string, string> = {};
  if (admin) headers["X-Admin-Key"] = getAdminKey();

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // le navigateur fixe lui-même le Content-Type multipart
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(apiUrl(path), { method, headers, body: payload });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new ApiError(res.status, await errorDetail(res));
  return (await res.json()) as T;
}

/** Variante pour les ressources facultatives : `null` si absente (404). Toute autre
 * erreur (500, réseau…) est propagée, pour ne pas confondre panne et absence. */
export async function requestOrNull<T>(path: string): Promise<T | null> {
  try {
    return await request<T>(path);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
