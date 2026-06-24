import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "fr" | "tn";

const STORAGE_KEY = "im_lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
};

const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  // Always start with "fr" on SSR + first client paint to avoid hydration mismatch,
  // then read the saved preference.
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "fr" || saved === "tn") setLangState(saved);
    } catch {
      // ignore
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  };

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === "fr" ? "tn" : "fr"),
    }),
    [lang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within <LangProvider>");
  return ctx;
}
