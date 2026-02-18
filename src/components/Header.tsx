interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onLogout?: () => void;
  userEmail?: string;
}

export default function Header({ title, subtitle, onBack, onLogout, userEmail }: HeaderProps) {
  return (
    <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center
                       rounded-full bg-blue-800 hover:bg-blue-700 transition-colors"
            aria-label="Volver"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-blue-300 truncate">{subtitle}</p>
          )}
        </div>

        {onLogout && userEmail && (
          <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
            <span className="text-xs text-blue-300 truncate max-w-[120px]">{userEmail.split("@")[0]}</span>
            <button
              onClick={onLogout}
              className="text-xs text-blue-300 hover:text-white transition-colors underline"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
