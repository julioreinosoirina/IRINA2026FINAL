import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import OptionCard from "./OptionCard";
import {
  CATEGORIAS, CATEGORIA_REFERENCIA, SISTEMA_FOLDER_ID,
  NIVELES_INCLUSION, CATEGORIAS_INCLUSION,
} from "../config";
import {
  listSubfolders,
  listFolderContents,
  uploadFile,
  resolveAreaLinks,
  resolvePath,
  clearCache,
  FOLDER_MIME,
} from "../services/driveService";
import type { DriveFile, DriveItem, AreaLink } from "../services/driveService";

const SISTEMA_ANTERIOR_ID = "11x-VqaBdYVWczCGGXtNYTkUOEdd6Qkin";

// ── Tipos de vista ──────────────────────────────────────────────────────────
type Vista =
  | { tipo: "inicio" }
  | { tipo: "cet_sector" }
  | { tipo: "cet_turno"; sector: string }
  | { tipo: "cet_alumnos"; sector: string; turno: string }
  | { tipo: "cet_categorias"; sector: string; turno: string; alumno: string }
  | { tipo: "cet_areas"; sector: string; turno: string; alumno: string; categoria: string }
  | { tipo: "inclusion_grupos" }
  | { tipo: "inclusion_alumnos"; nivel: string; nivelId: string }
  | { tipo: "inclusion_categorias"; nivel: string; alumno: string; alumnoId: string }
  | { tipo: "folder_view"; folderId: string; folderName: string };

interface AppMainProps {
  userEmail: string;
  token: string;
  onLogout: () => void;
}

export default function AppMain({ userEmail, token, onLogout }: AppMainProps) {
  const [historial, setHistorial] = useState<Vista[]>([{ tipo: "inicio" }]);
  const [folderItems, setFolderItems] = useState<DriveFile[]>([]);
  const [areaItems, setAreaItems] = useState<AreaLink[]>([]);
  const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const vista = historial[historial.length - 1];

  function navegar(v: Vista) {
    setHistorial((h) => [...h, v]);
    setFolderItems([]);
    setAreaItems([]);
    setDriveItems([]);
    setErrorMsg(null);
  }

  function volver() {
    if (historial.length > 1) {
      setHistorial((h) => h.slice(0, -1));
      setFolderItems([]);
      setAreaItems([]);
      setDriveItems([]);
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
        "folder_view",
      ].includes(vista.tipo);
      if (!needsLoad) return;

      setLoadingItems(true);
      setErrorMsg(null);
      setFolderItems([]);
      setAreaItems([]);
      setDriveItems([]);

      try {
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
            vista.alumno, token, SISTEMA_FOLDER_ID
          );
          if (!cancelled) {
            if (links.length === 0)
              setErrorMsg(`No se encontró la carpeta de ${vista.alumno} en ${vista.categoria}.`);
            else setAreaItems(links);
          }
        }

        else if (vista.tipo === "inclusion_grupos") {
          const id = await resolvePath(["INCLUSION"], token, SISTEMA_FOLDER_ID);
          if (!id) throw new Error("No se encontró la carpeta INCLUSION");
          const items = await listSubfolders(id, token);
          if (!cancelled) setFolderItems(items);
        }

        else if (vista.tipo === "inclusion_alumnos") {
          const items = await listSubfolders(vista.nivelId, token);
          if (!cancelled) setFolderItems(items);
        }

        else if (vista.tipo === "inclusion_categorias") {
          const items = await listSubfolders(vista.alumnoId, token);
          if (!cancelled) setFolderItems(items);
        }

        else if (vista.tipo === "folder_view") {
          const items = await listFolderContents(vista.folderId, token);
          if (!cancelled) setDriveItems(items);
        }

      } catch (e: unknown) {
        if (cancelled) return;
        if (e instanceof Error && e.message === "TOKEN_EXPIRED")
          setErrorMsg("La sesión expiró. Por favor, volvé a ingresar.");
        else
          setErrorMsg(e instanceof Error ? e.message : "Error al conectar con Google Drive.");
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    }

    cargar();
    return () => { cancelled = true; };
  }, [vista, token, refreshKey]);

  // ── Header info ──────────────────────────────────────────────────────────
  function getHeaderInfo(): { title: string; subtitle?: string } {
    switch (vista.tipo) {
      case "inicio":               return { title: "Instituto Irina", subtitle: "Seleccioná una sección" };
      case "cet_sector":           return { title: "CET", subtitle: "Seleccioná el sector" };
      case "cet_turno":            return { title: vista.sector, subtitle: "Seleccioná el turno" };
      case "cet_alumnos":          return { title: `${vista.sector} · ${vista.turno}`, subtitle: "Seleccioná un alumno" };
      case "cet_categorias":       return { title: vista.alumno, subtitle: `${vista.sector} · ${vista.turno}` };
      case "cet_areas":            return { title: vista.categoria, subtitle: vista.alumno };
      case "inclusion_grupos":     return { title: "INCLUSION", subtitle: "Seleccioná una sección" };
      case "inclusion_alumnos":    return { title: vista.nivel, subtitle: "Seleccioná un alumno" };
      case "inclusion_categorias": return { title: vista.alumno, subtitle: vista.nivel };
      case "folder_view":          return { title: vista.folderName, subtitle: "Archivos y carpetas" };
    }
  }

  const { title, subtitle } = getHeaderInfo();

  function retryCurrentVista() { setRefreshKey((k) => k + 1); }

  // ── Renderizado ──────────────────────────────────────────────────────────
  function renderContenido() {
    switch (vista.tipo) {

      case "inicio":
        return (
          <div className="space-y-4">
            <OptionCard label="CET" color="blue" icon={<SchoolIcon />}
              onClick={() => navegar({ tipo: "cet_sector" })} />
            <OptionCard label="INCLUSION" color="green" icon={<InclusionIcon />}
              onClick={() => navegar({ tipo: "inclusion_grupos" })} />
            <SistemaAnteriorCard
              onClick={() => navegar({ tipo: "folder_view", folderId: SISTEMA_ANTERIOR_ID, folderName: "Sistema Anterior 2025" })}
            />
          </div>
        );

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
        if (errorMsg) return <ErrorState mensaje={errorMsg} onRetry={retryCurrentVista} />;
        if (folderItems.length === 0) return <EmptyState texto="No se encontraron alumnos." />;
        return (
          <div className="space-y-3">
            {folderItems.map((a) => (
              <OptionCard key={a.id} label={a.name} color="blue" icon={<AlumnoIcon />}
                onClick={() => navegar({ tipo: "cet_categorias", sector: vista.sector, turno: vista.turno, alumno: a.name })} />
            ))}
          </div>
        );

      case "cet_categorias":
        return (
          <div className="space-y-3">
            {CATEGORIAS.map((cat) => (
              <OptionCard key={cat} label={cat} color="blue" icon={<CarpetaIcon />}
                onClick={() => navegar({ tipo: "cet_areas", sector: vista.sector, turno: vista.turno, alumno: vista.alumno, categoria: cat })} />
            ))}
          </div>
        );

      case "cet_areas":
        if (loadingItems) return <LoadingState texto="Buscando carpeta..." />;
        if (errorMsg) return <ErrorState mensaje={errorMsg} onRetry={retryCurrentVista} />;
        if (areaItems.length === 0) return <EmptyState texto="No hay carpetas disponibles." />;
        return (
          <div className="space-y-3">
            {areaItems.map((item) => (
              <FolderButton key={item.id} label={item.name}
                onClick={() => navegar({ tipo: "folder_view", folderId: item.id, folderName: item.name })} />
            ))}
          </div>
        );

      case "inclusion_grupos": {
        if (loadingItems) return <LoadingState texto="Cargando..." />;
        if (errorMsg) return <ErrorState mensaje={errorMsg} onRetry={retryCurrentVista} />;
        if (folderItems.length === 0) return <EmptyState texto="No se encontraron secciones." />;

        const nivelesNorm = NIVELES_INCLUSION.map((n) => n.toLowerCase());
        const niveles = folderItems.filter((f) => nivelesNorm.includes(f.name.toLowerCase()));
        const areas = folderItems.filter((f) => !nivelesNorm.includes(f.name.toLowerCase()));

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
                <SectionLabel texto="Áreas — subir archivos" />
                <div className="space-y-3">
                  {areas.map((a) => (
                    <FolderButton key={a.id} label={a.name}
                      onClick={() => navegar({ tipo: "folder_view", folderId: a.id, folderName: a.name })} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "inclusion_alumnos":
        if (loadingItems) return <LoadingState texto="Cargando alumnos..." />;
        if (errorMsg) return <ErrorState mensaje={errorMsg} onRetry={retryCurrentVista} />;
        if (folderItems.length === 0) return <EmptyState texto="No se encontraron alumnos." />;
        return (
          <div className="space-y-3">
            {folderItems.map((a) => (
              <OptionCard key={a.id} label={a.name} color="green" icon={<AlumnoIcon />}
                onClick={() => navegar({ tipo: "inclusion_categorias", nivel: vista.nivel, alumno: a.name, alumnoId: a.id })} />
            ))}
          </div>
        );

      case "inclusion_categorias": {
        if (loadingItems) return <LoadingState texto="Cargando carpetas..." />;
        if (errorMsg) return <ErrorState mensaje={errorMsg} onRetry={retryCurrentVista} />;

        const catNorm = (s: string) => s.toLowerCase().trim();
        const driveMap = new Map(folderItems.map((f) => [catNorm(f.name), f]));

        return (
          <div className="space-y-3">
            {CATEGORIAS_INCLUSION.map((cat) => {
              const found = driveMap.get(catNorm(cat));
              if (found) {
                return (
                  <FolderButton key={cat} label={cat}
                    onClick={() => navegar({ tipo: "folder_view", folderId: found.id, folderName: cat })} />
                );
              }
              return (
                <div key={cat}
                  className="w-full bg-white rounded-3xl px-5 py-4 flex items-center gap-4 opacity-40"
                  style={{ border: "2px solid #e7e5e4" }}>
                  <span className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#f5f5f4" }}>
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

      case "folder_view": {
        const subFolders = driveItems.filter((i) => i.mimeType === FOLDER_MIME);
        const files = driveItems.filter((i) => i.mimeType !== FOLDER_MIME);

        return (
          <div>
            <UploadZone
              folderId={vista.folderId}
              token={token}
              onUploaded={() => setRefreshKey((k) => k + 1)}
            />

            {loadingItems && <LoadingState texto="Cargando archivos..." />}
            {errorMsg && <ErrorState mensaje={errorMsg} onRetry={retryCurrentVista} />}

            {!loadingItems && !errorMsg && (
              <div className="space-y-5">
                {subFolders.length > 0 && (
                  <div>
                    <SectionLabel texto="Subcarpetas" />
                    <div className="space-y-3">
                      {subFolders.map((f) => (
                        <FolderButton key={f.id} label={f.name}
                          onClick={() => navegar({ tipo: "folder_view", folderId: f.id, folderName: f.name })} />
                      ))}
                    </div>
                  </div>
                )}
                {files.length > 0 && (
                  <div>
                    <SectionLabel texto="Archivos" />
                    <div className="space-y-2">
                      {files.map((f) => <FileCard key={f.id} item={f} />)}
                    </div>
                  </div>
                )}
                {subFolders.length === 0 && files.length === 0 && (
                  <EmptyState texto="Esta carpeta está vacía. Usá el botón de arriba para subir el primer archivo." />
                )}
              </div>
            )}
          </div>
        );
      }
    }
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

// ── UploadZone ───────────────────────────────────────────────────────────────

function UploadZone({ folderId, token, onUploaded }: {
  folderId: string;
  token: string;
  onUploaded: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setSuccess(null);
    setError(null);

    try {
      await uploadFile(folderId, file, token, setProgress);
      setSuccess(file.name);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mb-5">
      <input ref={inputRef} type="file" accept="*/*" className="hidden" onChange={handleFile} />

      <button
        onClick={() => { setSuccess(null); setError(null); inputRef.current?.click(); }}
        disabled={uploading}
        className="w-full py-4 rounded-3xl font-bold text-sm flex items-center justify-center gap-3 transition-all"
        style={{
          background: uploading
            ? "#fde68a"
            : "linear-gradient(135deg, #f59e0b, #d97706)",
          color: uploading ? "#92400e" : "#fff",
          border: "none",
          cursor: uploading ? "not-allowed" : "pointer",
          boxShadow: uploading ? "none" : "0 4px 14px rgba(245,158,11,0.35)",
        }}
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: "rgba(146,64,14,.3)", borderTopColor: "#92400e" }} />
            Subiendo... {progress}%
          </>
        ) : (
          <>
            <UploadIcon />
            Subir archivo a esta carpeta
          </>
        )}
      </button>

      {uploading && (
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "#fde68a" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "#f59e0b" }}
          />
        </div>
      )}

      {success && (
        <p className="text-xs font-semibold text-center mt-2" style={{ color: "#16a34a" }}>
          ✓ "{success}" subido correctamente
        </p>
      )}
      {error && (
        <p className="text-xs font-semibold text-center mt-2" style={{ color: "#dc2626" }}>
          ✗ {error}
        </p>
      )}
    </div>
  );
}

// ── FileCard ────────────────────────────────────────────────────────────────

function FileCard({ item }: { item: DriveItem }) {
  const viewUrl = item.mimeType.startsWith("application/vnd.google-apps")
    ? `https://drive.google.com/file/d/${item.id}/view`
    : `https://drive.google.com/file/d/${item.id}/view`;

  function formatSize(bytes?: string) {
    if (!bytes) return "";
    const n = parseInt(bytes);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(iso?: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <a
      href={viewUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full bg-white rounded-2xl px-4 py-3 flex items-center gap-3 transition-all active:scale-[0.97]"
      style={{ border: "1px solid #e7e5e4", textDecoration: "none", display: "flex" }}
    >
      <span className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: "#f5f5f4" }}>
        <FileTypeIcon mimeType={item.mimeType} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#1c1917" }}>{item.name}</p>
        <p className="text-xs mt-0.5" style={{ color: "#a8a29e" }}>
          {[formatSize(item.size), formatDate(item.modifiedTime)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="#d4d2cf" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

// ── FolderButton ─────────────────────────────────────────────────────────────

function FolderButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-3xl px-5 py-4 flex items-center gap-4 shadow-sm transition-all duration-150 active:scale-[0.97] select-none text-left"
      style={{ border: "2px solid #e7e5e4" }}
    >
      <span className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{ background: "#fef3c7" }}>
        <FolderIcon />
      </span>
      <span className="text-sm font-bold flex-1" style={{ color: "#1c1917" }}>{label}</span>
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#d4d2cf" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ── SistemaAnteriorCard ──────────────────────────────────────────────────────

function SistemaAnteriorCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-3xl overflow-hidden shadow-sm active:scale-[0.97] transition-all duration-150 select-none text-left"
      style={{ border: "2px solid #fed7aa" }}
    >
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: "#f97316" }}>
        <svg className="flex-shrink-0 w-3.5 h-3.5" fill="none" stroke="#fff" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: "#fff" }}>
          Acceso a información del año anterior
        </span>
      </div>
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: "#fff7ed" }}>
        <span className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#ffedd5" }}>
          <svg className="w-5 h-5" fill="none" stroke="#c2410c" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold" style={{ color: "#7c2d12" }}>Sistema Anterior Año 2025</p>
          <p className="text-xs mt-0.5" style={{ color: "#c2410c" }}>Solo lectura · No modifica el ciclo 2026</p>
        </div>
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#fed7aa" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ texto }: { texto: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#a8a29e" }}>
      {texto}
    </p>
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
      <button onClick={onRetry} className="text-sm underline" style={{ color: "#f59e0b" }}>
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

// ── Íconos ───────────────────────────────────────────────────────────────────

function SchoolIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 6.075-4.925 11-11 11S1 19.075 1 13c0-.937.117-1.848.34-2.717L12 14z" /></svg>;
}
function InclusionIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function SunIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>;
}
function MoonIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
}
function NinosIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>;
}
function JovenesIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
function AlumnoIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function GrupoIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
}
function CarpetaIcon({ color = "currentColor" }: { color?: string }) {
  return <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>;
}
function FolderIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="#d97706" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>;
}
function UploadIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
}
function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes("pdf"))
    return <svg className="w-4 h-4" fill="none" stroke="#dc2626" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  if (mimeType.includes("image"))
    return <svg className="w-4 h-4" fill="none" stroke="#7c3aed" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return <svg className="w-4 h-4" fill="none" stroke="#16a34a" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" /></svg>;
  if (mimeType.includes("document") || mimeType.includes("word"))
    return <svg className="w-4 h-4" fill="none" stroke="#2563eb" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  return <svg className="w-4 h-4" fill="none" stroke="#78716c" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
}
