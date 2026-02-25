import { useEffect, useState } from "react";
import Header from "./Header";
import OptionCard from "./OptionCard";
import {
  CATEGORIAS, CATEGORIA_REFERENCIA, SISTEMA_FOLDER_ID,
  NIVELES_INCLUSION, CATEGORIAS_INCLUSION,
} from "../config";
import {
  listSubfolders,
  resolveAreaLinks,
  resolvePath,
  driveUrl,
  clearCache,
} from "../services/driveService";
import type { DriveFile, AreaLink } from "../services/driveService";

// ── Tipos de vista ──────────────────────────────────────────────────────────
// CET:       SISTEMA/CET/[SECTOR]/[TURNO]/[CATEGORIA]/(AREA)/[ALUMNO]
// INCLUSION: SISTEMA/INCLUSION/[NIVEL]/[ALUMNO]/[CATEGORIA]   ← niveles con alumnos
//            SISTEMA/INCLUSION/[AREA]                          ← áreas directas

type Vista =
  | { tipo: "inicio" }
  | { tipo: "cet_sector" }
  | { tipo: "cet_turno"; sector: string }
  | { tipo: "cet_alumnos"; sector: string; turno: string }
  | { tipo: "cet_categorias"; sector: string; turno: string; alumno: string }
  | { tipo: "cet_areas"; sector: string; turno: string; alumno: string; categoria: string }
  | { tipo: "inclusion_grupos" }
  | { tipo: "inclusion_alumnos"; nivel: string; nivelId: string }
  | { tipo: "inclusion_categorias"; nivel: string; alumno: string; alumnoId: string };

interface AppMainProps {
  userEmail: string;
  token: string;
  onLogout: () => void;
}

export default function AppMain({ userEmail, token, onLogout }: AppMainProps) {
  const [historial, setHistorial] = useState<Vista[]>([{ tipo: "inicio" }]);
  const [folderItems, setFolderItems] = useState<DriveFile[]>([]);
  const [areaItems, setAreaItems] = useState<AreaLink[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const vista = historial[historial.length - 1];

  function navegar(v: Vista) {
    setHistorial((h) => [...h, v]);
    setFolderItems([]);
    setAreaItems([]);
    setErrorMsg(null);
  }

  function volver() {
    if (historial.length > 1) {
      setHistorial((h) => h.slice(0, -1));
      setFolderItems([]);
      setAreaItems([]);
      setErrorMsg(null);
    }
  }

  function handleLogout() {
    clearCache();
    onLogout();
  }

  // ── Carga dinámica desde Drive ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      const needsLoad = [
        "cet_alumnos", "cet_areas",
        "inclusion_grupos", "inclusion_alumnos", "inclusion_categorias",
      ].includes(vista.tipo);
      if (!needsLoad) return;

      setLoadingItems(true);
      setErrorMsg(null);
      setFolderItems([]);
      setAreaItems([]);

      try {
        // ── CET ──────────────────────────────────────────
        if (vista.tipo === "cet_alumnos") {
          const id = await resolvePath(
            ["CET", vista.sector, vista.turno, CATEGORIA_REFERENCIA],
            token, SISTEMA_FOLDER_ID
          );
          if (!id) throw new Error(`No se encontró: CET/${vista.sector}/${vista.turno}/${CATEGORIA_REFERENCIA}`);
          const items = await listSubfolders(id, token);
          if (!cancelled) setFolderItems(items);
        }

        else if (vista.tipo === "cet_areas") {
          const links = await resolveAreaLinks(
            ["CET", vista.sector, vista.turno, vista.categoria],
            vista.alumno,
            token,
            SISTEMA_FOLDER_ID
          );
          if (!cancelled) {
            if (links.length === 0) {
              setErrorMsg(`No se encontró la carpeta de ${vista.alumno} en ${vista.categoria}.`);
            } else {
              setAreaItems(links);
            }
          }
        }

        // ── INCLUSION ─────────────────────────────────────
        else if (vista.tipo === "inclusion_grupos") {
          const id = await resolvePath(["INCLUSION"], token, SISTEMA_FOLDER_ID);
          if (!id) throw new Error("No se encontró la carpeta INCLUSION");
          const items = await listSubfolders(id, token);
          if (!cancelled) setFolderItems(items);
        }

        else if (vista.tipo === "inclusion_alumnos") {
          // Usar el ID directo del nivel (ya lo tenemos)
          const items = await listSubfolders(vista.nivelId, token);
          if (!cancelled) setFolderItems(items);
        }

        else if (vista.tipo === "inclusion_categorias") {
          // Cargar subcarpetas reales del alumno (son las categorías)
          const items = await listSubfolders(vista.alumnoId, token);
          if (!cancelled) setFolderItems(items);
        }

      } catch (e: unknown) {
        if (cancelled) return;
        if (e instanceof Error && e.message === "TOKEN_EXPIRED") {
          setErrorMsg("La sesión expiró. Por favor, volvé a ingresar.");
        } else {
          setErrorMsg(e instanceof Error ? e.message : "Error al conectar con Google Drive.");
        }
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    }

    cargar();
    return () => { cancelled = true; };
  }, [vista, token]);

  // ── Header info ─────────────────────────────────────────────────────────────
  function getHeaderInfo(): { title: string; subtitle?: string } {
    switch (vista.tipo) {
      case "inicio":                 return { title: "Instituto Irina", subtitle: "Seleccioná una sección" };
      case "cet_sector":             return { title: "CET", subtitle: "Seleccioná el sector" };
      case "cet_turno":              return { title: vista.sector, subtitle: "Seleccioná el turno" };
      case "cet_alumnos":            return { title: `${vista.sector} · ${vista.turno}`, subtitle: "Seleccioná un alumno" };
      case "cet_categorias":         return { title: vista.alumno, subtitle: `${vista.sector} · ${vista.turno}` };
      case "cet_areas":              return { title: vista.categoria, subtitle: vista.alumno };
      case "inclusion_grupos":       return { title: "INCLUSION", subtitle: "Seleccioná una sección" };
      case "inclusion_alumnos":      return { title: vista.nivel, subtitle: "Seleccioná un alumno" };
      case "inclusion_categorias":   return { title: vista.alumno, subtitle: vista.nivel };
    }
  }

  const { title, subtitle } = getHeaderInfo();

  // ── Renderizado ─────────────────────────────────────────────────────────────
  function renderContenido() {
    switch (vista.tipo) {

      // ── Inicio ──
      case "inicio":
        return (
          <div className="space-y-4">
            <OptionCard label="CET" color="blue" icon={<SchoolIcon />}
              onClick={() => navegar({ tipo: "cet_sector" })} />
            <OptionCard label="INCLUSION" color="green" icon={<InclusionIcon />}
              onClick={() => navegar({ tipo: "inclusion_grupos" })} />
            <SistemaAnteriorCard />
          </div>
        );

      // ── CET ──
      case "cet_sector":
        return (
          <div className="space-y-4">
            <OptionCard label="NIÑOS" color="teal" icon={<NinosIcon />}
              onClick={() => navegar({ tipo: "cet_turno", sector: "NIÑOS" })} />
            <OptionCard label="JOVENES" color="purple" icon={<JovenesIcon />}
              onClick={() => navegar({ tipo: "cet_turno", sector: "JOVENES" })} />
          </div>
        );

      case "cet_turno":
        return (
          <div className="space-y-4">
            <OptionCard label="TURNO MAÑANA" color="orange" icon={<SunIcon />}
              onClick={() => navegar({ tipo: "cet_alumnos", sector: vista.sector, turno: "TURNO MAÑANA" })} />
            <OptionCard label="TURNO TARDE" color="indigo" icon={<MoonIcon />}
              onClick={() => navegar({ tipo: "cet_alumnos", sector: vista.sector, turno: "TURNO TARDE" })} />
          </div>
        );

      case "cet_alumnos":
        if (loadingItems) return <LoadingState texto="Cargando alumnos..." />;
        if (errorMsg)     return <ErrorState mensaje={errorMsg} onRetry={retryCurrentVista} />;
        if (folderItems.length === 0) return <EmptyState texto="No se encontraron alumnos." />;
        return (
          <div className="space-y-3">
            {folderItems.map((a) => (
              <OptionCard key={a.id} label={a.name} color="blue" icon={<AlumnoIcon />}
                onClick={() => navegar({
                  tipo: "cet_categorias",
                  sector: vista.sector,
                  turno: vista.turno,
                  alumno: a.name,
                })} />
            ))}
          </div>
        );

      case "cet_categorias":
        return (
          <div className="space-y-3">
            {CATEGORIAS.map((cat) => (
              <OptionCard key={cat} label={cat} color="blue" icon={<CarpetaIcon />}
                onClick={() => navegar({
                  tipo: "cet_areas",
                  sector: vista.sector,
                  turno: vista.turno,
                  alumno: vista.alumno,
                  categoria: cat,
                })} />
            ))}
          </div>
        );

      case "cet_areas":
        if (loadingItems) return <LoadingState texto="Buscando carpeta..." />;
        if (errorMsg)     return <ErrorState mensaje={errorMsg} onRetry={retryCurrentVista} />;
        if (areaItems.length === 0) return <EmptyState texto="No hay carpetas disponibles." />;
        return (
          <div className="space-y-3">
            {areaItems.map((item) => (
              <DriveLink key={item.id} label={item.name} url={driveUrl(item.id)} />
            ))}
          </div>
        );

      // ── INCLUSION ──
      case "inclusion_grupos": {
        if (loadingItems) return <LoadingState texto="Cargando..." />;
        if (errorMsg)     return <ErrorState mensaje={errorMsg} onRetry={retryCurrentVista} />;
        if (folderItems.length === 0) return <EmptyState texto="No se encontraron secciones." />;

        // Separar NIVELES (con alumnos) de ÁREAS (abrir directo en Drive)
        const nivelesNorm = NIVELES_INCLUSION.map((n) => n.toLowerCase());
        const niveles = folderItems.filter((f) => nivelesNorm.includes(f.name.toLowerCase()));
        const areas   = folderItems.filter((f) => !nivelesNorm.includes(f.name.toLowerCase()));

        return (
          <div className="space-y-5">
            {niveles.length > 0 && (
              <div>
                <SectionLabel texto="Niveles educativos" />
                <div className="space-y-3">
                  {niveles.map((n) => (
                    <OptionCard key={n.id} label={n.name} color="green" icon={<GrupoIcon />}
                      onClick={() => navegar({ tipo: "inclusion_alumnos", nivel: n.name, nivelId: n.id })} />
                  ))}
                </div>
              </div>
            )}
            {areas.length > 0 && (
              <div>
                <SectionLabel texto="Áreas — abrí para cargar archivos" />
                <div className="space-y-3">
                  {areas.map((a) => (
                    <DriveLink key={a.id} label={a.name} url={driveUrl(a.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "inclusion_alumnos":
        if (loadingItems) return <LoadingState texto="Cargando alumnos..." />;
        if (errorMsg)     return <ErrorState mensaje={errorMsg} onRetry={retryCurrentVista} />;
        if (folderItems.length === 0) return <EmptyState texto="No se encontraron alumnos." />;
        return (
          <div className="space-y-3">
            {folderItems.map((a) => (
              <OptionCard key={a.id} label={a.name} color="green" icon={<AlumnoIcon />}
                onClick={() => navegar({
                  tipo: "inclusion_categorias",
                  nivel: vista.nivel,
                  alumno: a.name,
                  alumnoId: a.id,
                })} />
            ))}
          </div>
        );

      case "inclusion_categorias": {
        if (loadingItems) return <LoadingState texto="Cargando carpetas..." />;
        if (errorMsg)     return <ErrorState mensaje={errorMsg} onRetry={retryCurrentVista} />;

        // Mostrar lista fija de categorías; si la carpeta existe en Drive, mostrar su link
        // Si no cargaron aún, mostrar la lista fija de todas formas con aviso
        const catNorm = (s: string) => s.toLowerCase().trim();
        const driveMap = new Map(folderItems.map((f) => [catNorm(f.name), f]));

        return (
          <div className="space-y-3">
            {CATEGORIAS_INCLUSION.map((cat) => {
              const found = driveMap.get(catNorm(cat));
              if (found) {
                return <DriveLink key={cat} label={cat} url={driveUrl(found.id)} />;
              }
              // Categoría no encontrada en Drive: mostrar deshabilitada
              return (
                <div key={cat}
                  className="w-full bg-white rounded-3xl px-5 py-4 flex items-center gap-4 opacity-40"
                  style={{ border: "2px solid #e7e5e4" }}>
                  <span className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: "#f5f5f4" }}>
                    <CarpetaIcon color="#a8a29e" />
                  </span>
                  <span className="text-sm font-bold text-left flex-1" style={{ color: "#78716c" }}>{cat}</span>
                  <span className="text-xs" style={{ color: "#a8a29e" }}>No existe</span>
                </div>
              );
            })}
          </div>
        );
      }
    }
  }

  function retryCurrentVista() {
    setHistorial([...historial]);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fafaf9" }}>
      <Header
        title={title}
        subtitle={subtitle}
        onBack={historial.length > 1 ? volver : undefined}
        onLogout={handleLogout}
        userEmail={userEmail}
      />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {renderContenido()}
      </main>
    </div>
  );
}

// ── Sub-componentes ─────────────────────────────────────────────────────────

function SistemaAnteriorCard() {
  return (
    <a
      href="https://drive.google.com/drive/folders/11x-VqaBdYVWczCGGXtNYTkUOEdd6Qkin?usp=drive_link"
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-3xl overflow-hidden shadow-sm active:scale-[0.97] transition-all duration-150 select-none"
      style={{ textDecoration: "none", border: "2px solid #fed7aa" }}
    >
      <div className="flex items-center gap-2 px-4 py-2"
        style={{ background: "#f97316" }}>
        <svg className="flex-shrink-0 w-3.5 h-3.5" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: "#fff", letterSpacing: "0.07em" }}>
          Acceso a información del año anterior
        </span>
      </div>
      <div className="flex items-center gap-3 px-4 py-3.5"
        style={{ background: "#fff7ed" }}>
        <span className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "#ffedd5" }}>
          <svg className="w-5 h-5" fill="none" stroke="#c2410c" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold leading-tight" style={{ color: "#7c2d12" }}>
            Sistema Anterior Año 2025
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#c2410c" }}>
            Solo lectura · No modifica el ciclo 2026
          </p>
        </div>
        <span className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold"
          style={{ background: "#f97316", color: "#fff" }}>
          Abrir
        </span>
      </div>
    </a>
  );
}

function SectionLabel({ texto }: { texto: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#a8a29e" }}>
      {texto}
    </p>
  );
}

function DriveLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full bg-white rounded-3xl px-5 py-4
                 flex items-center gap-4 shadow-sm transition-all duration-150
                 active:scale-[0.97] select-none"
      style={{ border: "2px solid #e7e5e4", textDecoration: "none" }}
    >
      <span className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{ background: "#fef3c7" }}>
        <FolderOpenIcon />
      </span>
      <span className="text-sm font-bold leading-snug text-left flex-1"
        style={{ color: "#1c1917" }}>{label}</span>
      <span className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap"
        style={{ background: "#fef3c7", color: "#92400e" }}>
        Abrir
      </span>
    </a>
  );
}

function LoadingState({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-10 h-10 border-4 rounded-full animate-spin"
        style={{ borderColor: "#fde68a", borderTopColor: "#f59e0b" }} />
      <p className="text-sm" style={{ color: "#a8a29e" }}>{texto}</p>
    </div>
  );
}

function ErrorState({ mensaje, onRetry }: { mensaje: string; onRetry: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-3xl px-5 py-6 text-center space-y-3">
      <p className="text-red-700 text-sm leading-relaxed">{mensaje}</p>
      <button onClick={onRetry}
        className="text-sm underline" style={{ color: "#f59e0b" }}>
        Reintentar
      </button>
    </div>
  );
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <div className="rounded-3xl px-5 py-10 text-center"
      style={{ background: "#f5f5f4", border: "2px solid #e7e5e4" }}>
      <p className="text-sm" style={{ color: "#a8a29e" }}>{texto}</p>
    </div>
  );
}

// ── Íconos SVG ───────────────────────────────────────────────────────────────

function SchoolIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 6.075-4.925 11-11 11S1 19.075 1 13c0-.937.117-1.848.34-2.717L12 14z" />
    </svg>
  );
}
function InclusionIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}
function NinosIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="7" r="4" strokeWidth={2} strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
    </svg>
  );
}
function JovenesIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function AlumnoIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function GrupoIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}
function CarpetaIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function FolderOpenIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="#d97706" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
    </svg>
  );
}
