import { useState } from "react";
import Login from "./components/Login";
import AppMain from "./components/AppMain";

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  if (!userEmail) {
    return <Login onLogin={(email) => setUserEmail(email)} />;
  }

  return (
    <AppMain
      userEmail={userEmail}
      onLogout={() => setUserEmail(null)}
    />
  );
}
