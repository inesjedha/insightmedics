import { Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import film16x9 from "@/assets/film/insight-medics-film-16x9.mp4";
import film4x5 from "@/assets/film/insight-medics-film-4x5.mp4";
import poster16x9 from "@/assets/film/poster-16x9.jpg";
import poster4x5 from "@/assets/film/poster-4x5.jpg";

const FILM_SECONDS = 52;

/**
 * Bouton « Voir le film » sous la vidéo explicative : ouvre le film de présentation dans
 * une fenêtre (<dialog> natif : Échap ferme, focus géré par le navigateur). Version 4:5
 * sur écran vertical, 16:9 sinon. La vidéo ne se charge qu'à l'ouverture.
 */
export function FilmButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [portrait, setPortrait] = useState(false);

  const show = () => {
    setPortrait(window.matchMedia("(max-aspect-ratio: 1/1)").matches);
    setOpen(true);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  // Lecture à l'ouverture, arrêt à la fermeture (Échap compris).
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => {
      videoRef.current?.pause();
      setOpen(false);
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);
  useEffect(() => {
    if (open) void videoRef.current?.play().catch(() => {});
  }, [open, portrait]);

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="mt-5 flex w-full items-center gap-4 rounded-md border border-foreground bg-background p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span className="relative block aspect-video w-24 shrink-0 overflow-hidden rounded-sm border border-foreground/20">
          <img src={poster16x9} alt="" className="h-full w-full object-cover" loading="lazy" />
          <span className="absolute inset-0 flex items-center justify-center bg-ink/25">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <Play aria-hidden className="ml-0.5 size-4" />
            </span>
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold">Voir le film</span>
          <span className="block text-sm text-muted-foreground">
            Insight Medics en {FILM_SECONDS} secondes, avec le son
          </span>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Film de présentation d'Insight Medics"
        onClick={(e) => e.target === dialogRef.current && close()}
        className="m-auto w-[min(92vw,calc(88vh*var(--ratio)))] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-ink/85"
        style={{ "--ratio": portrait ? "0.8" : "1.7778" } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Fermer le film"
          className="absolute -top-12 right-0 inline-flex size-10 items-center justify-center rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden className="size-5" />
        </button>
        {open && (
          <video
            ref={videoRef}
            key={portrait ? "4x5" : "16x9"}
            src={portrait ? film4x5 : film16x9}
            poster={portrait ? poster4x5 : poster16x9}
            controls
            playsInline
            preload="auto"
            className="block h-auto w-full rounded-md bg-ink"
          >
            Votre navigateur ne lit pas cette vidéo.
          </video>
        )}
      </dialog>
    </>
  );
}
