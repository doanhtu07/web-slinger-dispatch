import { Login } from "./screens/login";
import { Dashboard } from "./screens/dashboard";
import { Auth0Provider } from "@auth0/auth0-react";
import { LoadingScreen } from "./components/LoadingScreen";
import { convex } from "./lib/convex";
import { ConvexProviderWithAuth0 } from "convex/react-auth0";
import { useConvexAuth } from "convex/react";

function AppContent() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <Dashboard /> : <Login />;
}

function App() {
  return (
    <Auth0Provider
      domain={"dev-cu6cyrg1lkne65tq.us.auth0.com"}
      clientId={"6P7fWYrnbOgNaUB0uTsppHTeaMp6MzKm"}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <ConvexProviderWithAuth0 client={convex}>
        <AppContent />
      </ConvexProviderWithAuth0>
    </Auth0Provider>
  );
}

export default App;
