import { useEffect, useState } from "react";
import { createBrowserRouter, replace, RouterProvider } from "react-router";
import { ClientRegistry } from "./ClientRegistry";
import { DialogClient } from "./clients/DialogClient";
import { SocketClient } from "./clients/SocketClient";
import { DialogManager } from "./comps/DialogManager";
import { dataPage } from "./pages/data.page";
import { apiPage } from "./pages/api.page";
import { websites$idPage } from "./pages/websites.$id.page";
import { websitesPage } from "./pages/websites.page";
import { Route } from "./Route";

const router = createBrowserRouter([
  {
    path: Route.websites(),
    Component: websitesPage,
  },
  {
    path: Route.websites(":id"),
    Component: websites$idPage,
  },
  {
    path: Route.api(),
    Component: apiPage,
  },
  {
    path: Route.data(),
    Component: dataPage,
  },
  {
    path: "*",
    loader: () => replace("/websites"),
  },
]);

export function Website() {
  const [clientRegistry, setClientRegistry] = useState<ClientRegistry>();
  useEffect(() => {
    ClientRegistry.bootstrap().then((registry) => {
      setClientRegistry(registry);
      registry.get(SocketClient).connect();
    });
  }, []);
  if (clientRegistry) {
    return (
      <ClientRegistry.Context.Provider value={clientRegistry}>
        <RouterProvider router={router} />
        <DialogManager ref={(m) => clientRegistry.get(DialogClient).initialize(m)} />
      </ClientRegistry.Context.Provider>
    );
  }
  return null;
}
