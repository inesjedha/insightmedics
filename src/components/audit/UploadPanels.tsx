import { useEffect, useRef, useState, type DragEvent } from "react";
import { FileBarChart2, FileText, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Extensions acceptées par le backend (backend/app/services/audits.py). */
const DATA_ACCEPT = ".sav,.xlsx,.xls,.csv";
const PROTOCOL_ACCEPT = ".docx,.pdf,.txt";

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
function useFileDrop({
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

export function AuditUploader({
  file,
  onFile,
  disabled,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { dragging, rejected, clearRejected, handlers } = useFileDrop({
    accept: DATA_ACCEPT,
    disabled,
    onFile,
  });

  return (
    <div
      {...handlers}
      className={cn(
        "rounded-md border-2 border-dashed bg-card p-8 text-center transition-colors",
        dragging ? "border-brand bg-accent" : "border-foreground/30",
        disabled && "opacity-60",
      )}
    >
      <Upload className="mx-auto h-8 w-8 text-brand" aria-hidden />
      <h2 className="mt-4 font-sans text-lg font-semibold">Déposez votre base de données</h2>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        Glissez votre fichier ici ou choisissez-le : SPSS (.sav), Excel (.xlsx, .xls) ou CSV.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={DATA_ACCEPT}
        className="hidden"
        onChange={(e) => {
          clearRejected();
          onFile(e.target.files?.[0] ?? null);
        }}
        disabled={disabled}
        aria-label="Base de données à auditer"
      />

      <div className="mt-5">
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={disabled}>
          Choisir un fichier
        </Button>
      </div>

      {rejected && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          « {rejected} » n'est pas une base de données. Formats acceptés : SPSS (.sav), Excel
          (.xlsx, .xls) ou CSV.
        </p>
      )}

      {file && (
        <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm">
          <FileBarChart2 className="h-4 w-4 shrink-0 text-brand" aria-hidden />
          <span className="truncate font-medium">{file.name}</span>
          <span className="shrink-0 text-muted-foreground">
            · {(file.size / 1024).toFixed(1)} Ko
          </span>
        </div>
      )}

      <p className="mx-auto mt-6 flex max-w-md items-start justify-center gap-2 text-left text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
        Envoyez une base anonymisée (sans nom ni numéro de dossier). Votre fichier est supprimé
        automatiquement au bout de 30 jours.
      </p>
    </div>
  );
}

export function ProtocolUploader({
  protocol,
  onProtocol,
  disabled,
}: {
  protocol: File | null;
  onProtocol: (f: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { dragging, rejected, clearRejected, handlers } = useFileDrop({
    accept: PROTOCOL_ACCEPT,
    disabled,
    onFile: onProtocol,
  });
  return (
    <div
      {...handlers}
      className={cn(
        "rounded-md border border-dashed p-4 transition-colors",
        dragging ? "border-brand bg-accent" : "border-border bg-card/60",
        disabled && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <div>
            <p className="text-[15px] font-semibold">
              Protocole de recherche{" "}
              <span className="font-normal text-muted-foreground">(optionnel)</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Glissez-le ici ou ajoutez-le : Word (.docx), PDF ou texte. Utile pour l'audit complet,
              qui vérifie que les analyses prévues sont faisables avec votre base.
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={PROTOCOL_ACCEPT}
          className="hidden"
          onChange={(e) => {
            clearRejected();
            onProtocol(e.target.files?.[0] ?? null);
          }}
          disabled={disabled}
          aria-label="Protocole de recherche (optionnel)"
        />
        {protocol ? (
          <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-surface py-1 pl-3 pr-1 text-sm">
            <FileText className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            <span className="truncate font-medium">{protocol.name}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => onProtocol(null)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label="Retirer le protocole"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            Ajouter le protocole
          </Button>
        )}
      </div>
      {rejected && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          « {rejected} » n'est pas au bon format. Formats acceptés : Word (.docx), PDF ou texte
          (.txt).
        </p>
      )}
    </div>
  );
}
