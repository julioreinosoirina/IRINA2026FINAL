import { useEffect, useState } from "react";
import { GOOGLE_CLIENT_ID, INSTITUTO_DOMAIN } from "../config";

interface LoginProps {
  onLogin: (email: string, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gisReady, setGisReady] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        setGisReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  function handleSignIn() {
    if (!window.google?.accounts?.oauth2) return;
    setLoading(true);
    setError("");

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
      hosted_domain: INSTITUTO_DOMAIN,
      callback: async (response) => {
        if (response.error) {
          setLoading(false);
          setError("No se pudo iniciar sesión. Intentá de nuevo.");
          return;
        }
        try {
          const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${response.access_token}` },
          });
          const user = await res.json();
          const email: string = user.email ?? "";
          if (!email.toLowerCase().endsWith(`@${INSTITUTO_DOMAIN}`)) {
            setLoading(false);
            setError(`Solo se permiten cuentas del dominio @${INSTITUTO_DOMAIN}`);
            return;
          }
          onLogin(email, response.access_token);
        } catch {
          setLoading(false);
          setError("Error al verificar la cuenta. Intentá de nuevo.");
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  }

  const isConfigured = !GOOGLE_CLIENT_ID.startsWith("TU_");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #fef3c7 0%, #fde68a 35%, #fff7ed 60%, #fff 100%)" }}>
      <div className="flex flex-col items-center pt-14 pb-8 px-6">
        <div className="mb-5">
          <img
            src="/logo.png"
            alt="Instituto Irina"
            className="w-24 h-24 object-contain drop-shadow-lg"
            style={{ borderRadius: "24px" }}
          />
        </div>
        <h1 className="text-2xl font-extrabold text-amber-900 text-center leading-tight">Instituto Irina</h1>
        <p className="text-sm text-amber-700 text-center mt-1">Sistema de Gestión 2026</p>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl shadow-xl px-6 pt-8 pb-10" style={{ borderTopLeftRadius: "28px", borderTopRightRadius: "28px" }}>
        <h2 className="text-base font-bold text-stone-800 mb-6 text-center">Ingresá con tu cuenta institucional</h2>

        {!isConfigured && (
          <div className="mb-4 bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs rounded-2xl px-4 py-3">
            <strong>Pendiente de configuración:</strong> editar <code>src/config.ts</code> con el
            Client ID de Google y el ID de la carpeta SISTEMA.
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading || !gisReady || !isConfigured}
          className="w-full flex items-center justify-center gap-3
                     border-2 border-stone-200 bg-stone-50
                     hover:border-amber-400 hover:bg-amber-50
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-stone-700 font-semibold py-3.5 px-4 rounded-2xl transition-all duration-150"
        >
          <GoogleIcon />
          {!gisReady ? "Cargando..." : loading ? "Verificando..." : "Ingresar con Google"}
        </button>

        <p className="text-xs text-stone-400 text-center mt-5">
          Solo cuentas @{INSTITUTO_DOMAIN}
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
