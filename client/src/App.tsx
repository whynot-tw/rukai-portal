import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { PortalGate } from "./components/PortalGate";
import { ThemeProvider } from "./contexts/ThemeContext";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Updates from "./pages/Updates";

function ProtectedHome() { return <PortalGate><Home /></PortalGate>; }
function ProtectedAdmin() { return <PortalGate><Admin /></PortalGate>; }
function ProtectedUpdates() { return <PortalGate><Updates /></PortalGate>; }

function Router() {
  return <Switch><Route path="/" component={ProtectedHome} /><Route path="/updates" component={ProtectedUpdates} /><Route path="/admin" component={ProtectedAdmin} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
