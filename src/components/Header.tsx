interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onLogout?: () => void;
  userEmail?: string;
}

export default function Header({ title, subtitle, onBack, onLogout, userEmail }: HeaderProps) {
  return (
    <header className="text-white shadow-lg sticky top-0 z-10"
      style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center
                       rounded-2xl transition-colors"
            style={{ background: "rgba(255,255,255,0.2)" }}
            aria-label="Volver"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-extrabold truncate leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.75)" }}>{subtitle}</p>
          )}
        </div>

        {onLogout && userEmail && (
          <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
            <span className="text-xs truncate max-w-[120px]" style={{ color: "rgba(255,255,255,0.8)" }}>
              {userEmail.split("@")[0]}
            </span>
            <button
              onClick={onLogout}
              className="text-xs underline transition-colors"
              style={{ color: "rgba(255,255,255,0.7)", background: "transparent", border: "none", cursor: "pointer" }}
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
