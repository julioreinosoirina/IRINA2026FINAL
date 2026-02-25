import { useInstallPrompt } from "../hooks/useInstallPrompt";

export default function InstallBanner() {
  const { canInstall, triggerInstall, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
      style={{ background: "linear-gradient(0deg, #fef3c7 60%, transparent)" }}
    >
      <div
        className="max-w-lg mx-auto rounded-3xl px-5 py-4 flex items-center gap-4 shadow-xl"
        style={{ background: "#fff", border: "2px solid #fde68a" }}
      >
        <img
          src="/logo.png"
          alt="Instituto Irina"
          className="w-12 h-12 rounded-2xl flex-shrink-0 object-contain"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold" style={{ color: "#1c1917" }}>
            Instalar Instituto Irina
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#78716c" }}>
            Agregá la app a tu pantalla principal
          </p>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-xs px-3 py-2 rounded-xl font-semibold"
          style={{ background: "#f5f5f4", color: "#78716c", border: "none", cursor: "pointer" }}
        >
          Ahora no
        </button>
        <button
          onClick={triggerInstall}
          className="flex-shrink-0 text-xs px-4 py-2 rounded-xl font-bold"
          style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(245,158,11,0.4)",
          }}
        >
          Instalar
        </button>
      </div>
    </div>
  );
}
