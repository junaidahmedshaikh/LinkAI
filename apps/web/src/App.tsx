import { AppRoutes } from "./routes/AppRoutes";
import { useAuthSession } from "./hooks/useAuthSession";
import { useOAuthBootstrap } from "./hooks/useOAuthBootstrap";

export default function App() {
  useAuthSession();
  useOAuthBootstrap();
  return <AppRoutes />;
}
