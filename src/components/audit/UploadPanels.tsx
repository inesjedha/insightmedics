import { useRef, useState } from "react";
import { FileBarChart2, FileText, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Extensions acceptées par le backend (backend/app/services/audits.py). */
const DATA_ACCEPT = ".sav,.xlsx,.xls,.csv";
const PROTOCOL_ACCEPT = ".docx,.pdf,.txt";

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
  const [drag, setDrag] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (disabled) return;
        const f = e.dataTransfer.files?.[0] ?? null;
        if (f) onFile(f);
      }}
      className={cn(
        "rounded-md border-2 border-dashed bg-card p-8 text-center transition-colors",
        drag ? "border-brand bg-accent" : "border-foreground/30",
        disabled && "opacity-60",
      )}
    >
      <Upload className="mx-auto h-8 w-8 text-brand" aria-hidden />
      <h3 className="mt-4 text-lg font-semibold">Déposez votre base de données</h3>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        Glissez votre fichier ici ou choisissez-le : SPSS (.sav), Excel (.xlsx, .xls) ou CSV.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={DATA_ACCEPT}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        disabled={disabled}
        aria-label="Base de données à auditer"
      />

      <div className="mt-5">
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={disabled}>
          Choisir un fichier
        </Button>
      </div>

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
        automatiquement au bout de 30 jours.
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
  return (
    <div className="rounded-md border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <div>
            <p className="text-[15px] font-semibold">
              Protocole de recherche{" "}
              <span className="font-normal text-muted-foreground">(optionnel)</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Word ou PDF. Avec votre protocole, l'audit vérifie aussi que les analyses prévues sont
              faisables.
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={PROTOCOL_ACCEPT}
          className="hidden"
          onChange={(e) => onProtocol(e.target.files?.[0] ?? null)}
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
    </div>
  );
}
