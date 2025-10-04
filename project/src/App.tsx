import { Login } from "./screens/login";
import { Dashboard } from "./screens/dashboard";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { LoadingScreen } from "./components/LoadingScreen";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <Dashboard /> : <Login />;
}

function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <AppContent />
    </Auth0Provider>
  );
}

export default App;
