import { useCallback, useEffect, useState } from "react";
import { UnauthorizedError } from "@/lib/api/client";

/**
 * Charge une ressource admin : état de chargement, message d'erreur lisible, rechargement.
 * Un 401 n'est pas affiché ici : AdminGate ramène déjà à l'écran de connexion.
 */
export function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (e) {
      if (!(e instanceof UnauthorizedError)) {
        setError(e instanceof Error ? e.message : "Erreur de chargement");
      }
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
