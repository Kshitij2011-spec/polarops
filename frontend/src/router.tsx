import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const createPolarOpsRouter = (queryClient: QueryClient) => {
  return createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
};

export type AppRouter = ReturnType<typeof createPolarOpsRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
