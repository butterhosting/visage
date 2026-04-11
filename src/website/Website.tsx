import { useEffect, useState } from "react";
import { createBrowserRouter, replace, RouterProvider } from "react-router";
import { ClientRegistry } from "./ClientRegistry";
import { DialogClient } from "./clients/DialogClient";
import { SocketClient } from "./clients/SocketClient";
import { DialogManager } from "./comps/DialogManager";
import { settingsPage } from "./pages/settings.page";
import { interfacePage } from "./pages/interface.page";
import { websites$refPage } from "./pages/websites.$ref.page";
import { websitesPage } from "./pages/websites.page";
import { Route } from "./Route";

const router = createBrowserRouter([
  {
    path: Route.websites(),
    Component: websitesPage,
  },
  {
    path: Route.websites(":ref"),
    Component: websites$refPage,
  },
  {
    path: Route.interface(),
    Component: interfacePage,
  },
  {
    path: Route.settings(),
    Component: settingsPage,
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
