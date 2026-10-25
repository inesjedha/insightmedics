import { useRef, useState } from "react";
import { FileBarChart2, FileText, Upload } from "lucide-react";
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
        drag ? "border-brand bg-brand/5" : "border-border",
        disabled && "opacity-60",
      )}
    >
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-md bg-brand/10 text-brand">
        <Upload className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-sans text-lg font-bold">Téléversez votre base de données</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Formats acceptés : SPSS (.sav), Excel (.xlsx, .xls) et CSV.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={DATA_ACCEPT}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        disabled={disabled}
      />

      <div className="mt-5">
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={disabled}>
          Choisir un fichier
        </Button>
      </div>

      {file && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
          <FileBarChart2 className="h-4 w-4 text-brand" />
          <span className="font-medium">{file.name}</span>
          <span className="text-muted-foreground">· {(file.size / 1024).toFixed(1)} Ko</span>
        </div>
      )}
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
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              Protocole de recherche{" "}
              <span className="font-normal text-muted-foreground">(optionnel)</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Word ou PDF. Avec le protocole, l'audit évalue aussi la faisabilité de vos analyses.
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
        />
        {protocol ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
            <FileText className="h-3.5 w-3.5 text-brand" />
            <span className="font-medium">{protocol.name}</span>
            {!disabled && (
              <button
                onClick={() => onProtocol(null)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Retirer le protocole"
              >
                ✕
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
