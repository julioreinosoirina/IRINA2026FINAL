import Header from "./Header";
import OptionCard from "./OptionCard";
import { ALUMNOS, CATEGORIAS, DRIVE_LINKS } from "../config";
import type { Categoria } from "../config";

type Seccion = "CET" | "INCLUSION";
type Turno = "TURNO MAÑANA" | "TURNO TARDE";
type Sector = "SECTOR NIÑOS" | "SECTOR JOVENES";

type Vista =
  | { tipo: "inicio" }
  | { tipo: "cet_turno" }
  | { tipo: "cet_sector"; turno: Turno }
  | { tipo: "alumnos"; path: string; label: string }
  | { tipo: "categorias"; path: string; alumno: string; label: string }
  | { tipo: "inclusion_alumnos" };

interface AppMainProps {
  userEmail: string;
  onLogout: () => void;
}

export default function AppMain({ userEmail, onLogout }: AppMainProps) {
  const [historial, setHistorial] = useState<Vista[]>([{ tipo: "inicio" }]);

  const vista = historial[historial.length - 1];

  function navegar(v: Vista) {
    setHistorial((h) => [...h, v]);
  }

  function volver() {
    setHistorial((h) => (h.length > 1 ? h.slice(0, -1) : h));
  }

  function buildPath(seccion: Seccion, turno?: Turno, sector?: Sector): string {
    if (seccion === "INCLUSION") return "INCLUSION";
    return [seccion, turno, sector].filter(Boolean).join("/");
  }

  function getHeaderInfo(): { title: string; subtitle?: string } {
    switch (vista.tipo) {
      case "inicio":
        return { title: "Instituto Irina", subtitle: "Seleccione una sección" };
      case "cet_turno":
        return { title: "CET", subtitle: "Seleccione el turno" };
      case "cet_sector":
        return { title: vista.turno, subtitle: "Seleccione el sector" };
      case "alumnos":
        return { title: vista.label, subtitle: "Seleccione un alumno" };
      case "inclusion_alumnos":
        return { title: "INCLUSION", subtitle: "Seleccione un alumno" };
      case "categorias":
        return { title: vista.alumno.toUpperCase(), subtitle: vista.label };
    }
  }

  const { title, subtitle } = getHeaderInfo();

  function renderContenido() {
    switch (vista.tipo) {
      case "inicio":
        return (
          <div className="space-y-4">
            <OptionCard
              label="CET"
              color="blue"
              icon={<SchoolIcon />}
              onClick={() => navegar({ tipo: "cet_turno" })}
            />
            <OptionCard
              label="INCLUSION"
              color="green"
              icon={<InclusionIcon />}
              onClick={() => navegar({ tipo: "inclusion_alumnos" })}
            />
          </div>
        );

      case "cet_turno":
        return (
          <div className="space-y-4">
            <OptionCard
              label="TURNO MAÑANA"
              color="orange"
              icon={<SunIcon />}
              onClick={() => navegar({ tipo: "cet_sector", turno: "TURNO MAÑANA" })}
            />
            <OptionCard
              label="TURNO TARDE"
              color="indigo"
              icon={<MoonIcon />}
              onClick={() => navegar({ tipo: "cet_sector", turno: "TURNO TARDE" })}
            />
          </div>
        );

      case "cet_sector": {
        const { turno } = vista;
        return (
          <div className="space-y-4">
            <OptionCard
              label="SECTOR NIÑOS"
              color="teal"
              icon={<NinosIcon />}
              onClick={() => {
                const path = buildPath("CET", turno, "SECTOR NIÑOS");
                navegar({ tipo: "alumnos", path, label: `${turno} / SECTOR NIÑOS` });
              }}
            />
            <OptionCard
              label="SECTOR JOVENES"
              color="purple"
              icon={<JovenesIcon />}
              onClick={() => {
                const path = buildPath("CET", turno, "SECTOR JOVENES");
                navegar({ tipo: "alumnos", path, label: `${turno} / SECTOR JOVENES` });
              }}
            />
          </div>
        );
      }

      case "inclusion_alumnos": {
        const alumnos = ALUMNOS["INCLUSION"] ?? [];
        return (
          <div className="space-y-3">
            {alumnos.map((alumno) => (
              <OptionCard
                key={alumno}
                label={alumno.toUpperCase()}
                color="green"
                icon={<AlumnoIcon />}
                onClick={() =>
                  navegar({ tipo: "categorias", path: "INCLUSION", alumno, label: "INCLUSION" })
                }
              />
            ))}
          </div>
        );
      }

      case "alumnos": {
        const { path, label } = vista;
        const alumnos = ALUMNOS[path] ?? [];
        return (
          <div className="space-y-3">
            {alumnos.map((alumno) => (
              <OptionCard
                key={alumno}
                label={alumno.toUpperCase()}
                color="blue"
                icon={<AlumnoIcon />}
                onClick={() => navegar({ tipo: "categorias", path, alumno, label })}
              />
            ))}
          </div>
        );
      }

      case "categorias": {
        const { path, alumno } = vista;
        const links = DRIVE_LINKS[path]?.[alumno] ?? {};
        return (
          <div className="space-y-3">
            {CATEGORIAS.map((cat) => {
              const url = links[cat as Categoria];
              return (
                <DriveLink key={cat} label={cat} url={url} />
              );
            })}
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
        onLogout={onLogout}
        userEmail={userEmail}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {renderContenido()}
      </main>
    </div>
  );
}

function DriveLink({ label, url }: { label: string; url?: string }) {
  if (!url || url.includes("FOLDER_ID_AQUI")) {
    return (
      <div className="w-full bg-gray-200 text-gray-500 font-medium rounded-2xl px-5 py-4
                      flex items-center gap-4 shadow-sm">
        <span className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-xl flex items-center justify-center">
          <FolderIcon className="text-gray-400" />
        </span>
        <span className="text-sm leading-snug text-left">{label}</span>
        <span className="ml-auto text-xs text-gray-400">Sin configurar</span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full bg-white border border-gray-200 hover:border-blue-400
                 hover:bg-blue-50 active:bg-blue-100
                 text-gray-800 font-medium rounded-2xl px-5 py-4
                 flex items-center gap-4 shadow-sm transition-all duration-150
                 active:scale-[0.98] select-none"
    >
      <span className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
        <FolderIcon className="text-blue-600" />
      </span>
      <span className="text-sm leading-snug text-left">{label}</span>
      <svg className="ml-auto flex-shrink-0 w-5 h-5 text-blue-500 opacity-70"
           fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

// ---- Iconos SVG inline ----

import { useState } from "react";

function SchoolIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5z" />
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

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className ?? ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
