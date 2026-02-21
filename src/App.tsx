import { useState } from "react";
import Login from "./components/Login";
import AppMain from "./components/AppMain";

interface AuthState {
  email: string;
  token: string;
}

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);

  if (!auth) {
    return (
      <Login onLogin={(email, token) => setAuth({ email, token })} />
    );
  }

  return (
    <AppMain
      userEmail={auth.email}
      token={auth.token}
      onLogout={() => setAuth(null)}
    />
  );
}
