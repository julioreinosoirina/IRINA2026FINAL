import { useEffect, useState } from "react";
import Header from "./Header";
import OptionCard from "./OptionCard";
import { CATEGORIAS, CATEGORIA_REFERENCIA, SISTEMA_FOLDER_ID } from "../config";
import { listSubfolders, resolvePath, driveUrl, clearCache } from "../services/driveService";
import type { DriveFile } from "../services/driveService";

// ── Tipos de vista ──────────────────────────────────────────
type Vista =
  | { tipo: "inicio" }
  | { tipo: "cet_turno" }
  | { tipo: "cet_sector"; turno: string }
  | { tipo: "alumnos"; drivePath: string[]; label: string }
  | { tipo: "categorias"; drivePath: string[]; alumno: string; label: string }
  | { tipo: "areas"; drivePath: string[]; alumno: string; categoria: string; label: string };

interface AppMainProps {
  userEmail: string;
  token: string;
  onLogout: () => void;
}

// ── Componente principal ────────────────────────────────────
export default function AppMain({ userEmail, token, onLogout }: AppMainProps) {
  const [historial, setHistorial] = useState<Vista[]>([{ tipo: "inicio" }]);
  const [items, setItems] = useState<DriveFile[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const vista = historial[historial.length - 1];

  function navegar(v: Vista) {
    setHistorial((h) => [...h, v]);
    setItems([]);
    setErrorMsg(null);
  }

  function volver() {
    setHistorial((h) => (h.length > 1 ? h.slice(0, -1) : h));
    setItems([]);
    setErrorMsg(null);
  }

  function handleLogout() {
    clearCache();
    onLogout();
  }

  // Carga dinámica desde Drive cuando la vista lo requiere
  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      if (vista.tipo !== "alumnos" && vista.tipo !== "areas") return;

      setLoadingItems(true);
      setErrorMsg(null);
      setItems([]);

      try {
        let parentId: string | null = null;

        if (vista.tipo === "alumnos") {
          parentId = await resolvePath(vista.drivePath, token, SISTEMA_FOLDER_ID);
        } else if (vista.tipo === "areas") {
          parentId = await resolvePath(vista.drivePath, token, SISTEMA_FOLDER_ID);
        }

        if (!parentId) {
          if (!cancelled) setErrorMsg("No se encontró la carpeta raíz SISTEMA. Verificá el ID en config.ts.");
          return;
        }

        const lista = await listSubfolders(parentId, token);
        if (!cancelled) setItems(lista);
      } catch (e: unknown) {
        if (cancelled) return;
        if (e instanceof Error && e.message === "TOKEN_EXPIRED") {
          setErrorMsg("La sesión expiró. Por favor, volvé a ingresar.");
        } else if (e instanceof Error && e.message.startsWith("FOLDER_NOT_FOUND:")) {
          setErrorMsg(e.message.replace("FOLDER_NOT_FOUND: ", ""));
        } else {
          setErrorMsg("Error al conectar con Google Drive. Verificá tu conexión.");
        }
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    }

    cargar();
    return () => { cancelled = true; };
  }, [vista, token]);

  // ── Header info ─────────────────────────────────────────
  function getHeaderInfo(): { title: string; subtitle?: string } {
    switch (vista.tipo) {
      case "inicio":      return { title: "Instituto Irina", subtitle: "Seleccioná una sección" };
      case "cet_turno":   return { title: "CET", subtitle: "Seleccioná el turno" };
      case "cet_sector":  return { title: vista.turno, subtitle: "Seleccioná el sector" };
      case "alumnos":     return { title: vista.label, subtitle: "Seleccioná un alumno" };
      case "categorias":  return { title: vista.alumno.toUpperCase(), subtitle: vista.label };
      case "areas":       return { title: vista.categoria, subtitle: `${vista.alumno} · ${vista.label}` };
    }
  }

  const { title, subtitle } = getHeaderInfo();

  // ── Renderizado por vista ────────────────────────────────
  function renderContenido() {
    switch (vista.tipo) {

      case "inicio":
        return (
          <div className="space-y-4">
            <OptionCard label="CET" color="blue" icon={<SchoolIcon />}
              onClick={() => navegar({ tipo: "cet_turno" })} />
            <OptionCard label="INCLUSION" color="green" icon={<InclusionIcon />}
              onClick={() => navegar({
                tipo: "alumnos",
                drivePath: ["INCLUSION"],
                label: "INCLUSION",
              })} />
          </div>
        );

      case "cet_turno":
        return (
          <div className="space-y-4">
            <OptionCard label="TURNO MAÑANA" color="orange" icon={<SunIcon />}
              onClick={() => navegar({ tipo: "cet_sector", turno: "TURNO MAÑANA" })} />
            <OptionCard label="TURNO TARDE" color="indigo" icon={<MoonIcon />}
              onClick={() => navegar({ tipo: "cet_sector", turno: "TURNO TARDE" })} />
          </div>
        );

      case "cet_sector": {
        const { turno } = vista;
        return (
          <div className="space-y-4">
            <OptionCard label="SECTOR NIÑOS" color="teal" icon={<NinosIcon />}
              onClick={() => navegar({
                tipo: "alumnos",
                drivePath: ["CET", turno, "SECTOR NIÑOS", CATEGORIA_REFERENCIA],
                label: `${turno} · SECTOR NIÑOS`,
              })} />
            <OptionCard label="SECTOR JOVENES" color="purple" icon={<JovenesIcon />}
              onClick={() => navegar({
                tipo: "alumnos",
                drivePath: ["CET", turno, "SECTOR JOVENES", CATEGORIA_REFERENCIA],
                label: `${turno} · SECTOR JOVENES`,
              })} />
          </div>
        );
      }

      case "alumnos": {
        const { drivePath, label } = vista;
        const isInclusion = drivePath[0] === "INCLUSION";

        if (loadingItems) return <LoadingState texto="Cargando alumnos..." />;
        if (errorMsg)     return <ErrorState mensaje={errorMsg} onRetry={() => setHistorial([...historial])} />;

        return (
          <div className="space-y-3">
            {items.length === 0 && (
              <EmptyState texto="No se encontraron alumnos en esta sección." />
            )}
            {items.map((alumno) => {
              const categoriasPath = isInclusion
                ? ["INCLUSION", alumno.name]
                : drivePath.slice(0, 3); // ["CET", turno, sector]

              return (
                <OptionCard
                  key={alumno.id}
                  label={alumno.name.toUpperCase()}
                  color={isInclusion ? "green" : "blue"}
                  icon={<AlumnoIcon />}
                  onClick={() => navegar({
                    tipo: "categorias",
                    drivePath: categoriasPath,
                    alumno: alumno.name,
                    label,
                  })}
                />
              );
            })}
          </div>
        );
      }

      case "categorias": {
        const { drivePath, alumno, label } = vista;
        const isInclusion = drivePath[0] === "INCLUSION";

        return (
          <div className="space-y-3">
            {CATEGORIAS.map((cat) => {
              const areasDrivePath = isInclusion
                ? [...drivePath, cat]           // INCLUSION/alumno/CATEGORIA
                : [...drivePath, cat, alumno];  // CET/turno/sector/CATEGORIA/alumno

              return (
                <OptionCard
                  key={cat}
                  label={cat}
                  color="blue"
                  icon={<CarpetaIcon />}
                  onClick={() => navegar({
                    tipo: "areas",
                    drivePath: areasDrivePath,
                    alumno,
                    categoria: cat,
                    label,
                  })}
                />
              );
            })}
          </div>
        );
      }

      case "areas": {
        const { alumno, categoria } = vista;

        if (loadingItems) return <LoadingState texto="Cargando áreas..." />;
        if (errorMsg)     return <ErrorState mensaje={errorMsg} onRetry={() => setHistorial([...historial])} />;

        return (
          <div className="space-y-3">
            {items.length === 0 && (
              <EmptyState texto={`No se encontraron áreas para ${alumno} en ${categoria}.`} />
            )}
            {items.map((area) => (
              <AreaLink key={area.id} label={area.name} url={driveUrl(area.id)} />
            ))}
          </div>
        );
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
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

// ── Sub-componentes ─────────────────────────────────────────

function AreaLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50
                 active:bg-blue-100 text-gray-800 font-medium rounded-2xl px-5 py-4
                 flex items-center gap-4 shadow-sm transition-all duration-150 active:scale-[0.98] select-none"
    >
      <span className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
        <FolderOpenIcon />
      </span>
      <span className="text-sm leading-snug text-left flex-1">{label}</span>
      <svg className="flex-shrink-0 w-5 h-5 text-blue-500"
           fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

function LoadingState({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">{texto}</p>
    </div>
  );
}

function ErrorState({ mensaje, onRetry }: { mensaje: string; onRetry: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-6 text-center space-y-3">
      <p className="text-red-700 text-sm">{mensaje}</p>
      <button onClick={onRetry}
        className="text-sm text-blue-600 underline hover:text-blue-800">
        Reintentar
      </button>
    </div>
  );
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-10 text-center">
      <p className="text-gray-400 text-sm">{texto}</p>
    </div>
  );
}

// ── Íconos SVG ───────────────────────────────────────────────

function SchoolIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 6.075-4.925 11-11 11S1 19.075 1 13c0-.937.117-1.848.34-2.717L12 14z" />
    </svg>
  );
}
function InclusionIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}
function NinosIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="7" r="4" strokeWidth={2} strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
    </svg>
  );
}
function JovenesIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function AlumnoIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function CarpetaIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function FolderOpenIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
    </svg>
  );
}
