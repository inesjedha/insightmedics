import { useEffect, useRef, useState, type DragEvent } from "react";

/** L'attribut `accept` ne filtre que la fenêtre « Choisir un fichier », pas un dépôt. */
function hasAcceptedExtension(file: File, accept: string): boolean {
  const name = file.name.toLowerCase();
  return accept.split(",").some((ext) => name.endsWith(ext.trim()));
}

/**
 * Glisser-déposer d'un fichier sur une zone. Le compteur évite le clignotement : le
 * navigateur envoie un `dragleave` à chaque passage au-dessus d'un élément enfant.
 * Un fichier lâché à côté d'une zone ne doit pas ouvrir le fichier à la place de la page
 * (comportement par défaut du navigateur) : on l'empêche au niveau de la fenêtre.
 */
export function useFileDrop({
  accept,
  disabled,
  onFile,
}: {
  accept: string;
  disabled?: boolean;
  onFile: (f: File) => void;
}) {
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  useEffect(() => {
    const block = (e: globalThis.DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  const handlers = {
    onDragEnter: (e: DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      depth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = disabled ? "none" : "copy";
    },
    onDragLeave: () => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      if (disabled) return;
      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      if (!hasAcceptedExtension(f, accept)) {
        setRejected(f.name);
        return;
      }
      setRejected(null);
      onFile(f);
    },
  };
  return { dragging, rejected, clearRejected: () => setRejected(null), handlers };
}
