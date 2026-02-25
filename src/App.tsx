import { useState } from "react";
import Login from "./components/Login";
import AppMain from "./components/AppMain";
import InstallBanner from "./components/InstallBanner";

interface AuthState {
  email: string;
  token: string;
}

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);

  return (
    <>
      {!auth ? (
        <Login onLogin={(email, token) => setAuth({ email, token })} />
      ) : (
        <AppMain
          userEmail={auth.email}
          token={auth.token}
          onLogout={() => setAuth(null)}
        />
      )}
      <InstallBanner />
    </>
  );
}
