import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { OperationsProvider, ThemeProvider } from "../components/polarops";
import { StationProvider } from "@/context/StationContext";
import { AppShell } from "@/components/shell/AppShell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070B12] text-slate-100 px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-7xl font-bold font-mono text-sky-400">404</h1>
        <h2 className="text-xl font-semibold text-slate-200">Workspace View Not Found</h2>
        <p className="text-sm text-slate-400">
          The requested operational view does not exist or has been relocated in the three-macro-workspace architecture.
        </p>
        <div className="pt-4 flex justify-center gap-3 font-mono text-xs">
          <Link
            to="/twin"
            search={{ station: "STATION-BHARATI" }}
            className="px-4 py-2 rounded bg-sky-950 text-sky-200 border border-sky-700 hover:bg-sky-900 font-bold uppercase transition-colors"
          >
            Go to Digital Twin
          </Link>
          <Link
            to="/"
            className="px-4 py-2 rounded bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 uppercase transition-colors"
          >
            Mission Gateway
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error("Root route error boundary caught error:", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070B12] text-slate-100 px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-bold font-mono text-red-400 tracking-wide">
          Operational System Fault
        </h1>
        <p className="text-sm text-slate-400">
          The application encountered an unexpected boundary error. Operational state is quarantined.
        </p>
        <div className="pt-4 flex justify-center gap-3 font-mono text-xs">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="px-4 py-2 rounded bg-sky-950 text-sky-200 border border-sky-700 hover:bg-sky-900 font-bold uppercase cursor-pointer"
          >
            Reset Fault
          </button>
          <a
            href="/twin?station=STATION-BHARATI"
            className="px-4 py-2 rounded bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 uppercase"
          >
            Return to Operations
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = pathname === "/" || pathname === "";

  return (
    <QueryClientProvider client={queryClient}>
      <StationProvider>
        <ThemeProvider>
          <OperationsProvider>
            {isLanding ? (
              <Outlet />
            ) : (
              <AppShell>
                <Outlet />
              </AppShell>
            )}
          </OperationsProvider>
        </ThemeProvider>
      </StationProvider>
    </QueryClientProvider>
  );
}
