import clsx from "clsx";
import { ComponentProps, useState } from "react";
import { Link, useLocation } from "react-router";
import { RestrictedClient } from "../clients/RestrictedClient";
import { useRegistry } from "../hooks/useRegistry";
import { Route } from "../Route";
import { Paper } from "./Paper";
import { Spinner } from "./Spinner";

type Props = ComponentProps<"main">;
export function Skeleton(props: Props) {
  return (
    <>
      <Skeleton.Header />
      <Skeleton.Main {...props} />
      <Skeleton.Footer />
    </>
  );
}

export namespace Skeleton {
  export function Header() {
    const { pathname } = useLocation();
    const websiteRef = pathname.startsWith("/websites/") ? pathname.slice("/websites/".length) : undefined;
    return (
      <nav className="mt-10 flex flex-wrap items-center gap-3 md:items-start">
        <Paper className="flex items-center hover:shadow-xl">
          <Link to={Route.websites()} className="p-4 text-lg hover:text-c-accent transition-colors">
            Websites
          </Link>
          {websiteRef && (
            <>
              <span>|</span>
              <span className="p-4 text-lg text-c-accent font-medium">{websiteRef}</span>
            </>
          )}
        </Paper>
        <div className="flex-1 md:hidden" />
        <Link to={Route.interface()}>
          <Paper
            className={clsx(
              "hover:shadow-xl p-4 text-lg transition-colors",
              pathname.startsWith(Route.interface()) ? "text-c-accent bg-c-accent/5" : "hover:text-c-accent",
            )}
          >
            API
          </Paper>
        </Link>
        <Link to={Route.settings()}>
          <Paper
            className={clsx(
              "hover:shadow-xl p-4 text-lg transition-colors",
              pathname.startsWith(Route.settings()) ? "text-c-accent bg-c-accent/5" : "hover:text-c-accent",
            )}
          >
            Settings
          </Paper>
        </Link>
      </nav>
    );
  }

  export function Main(props: Props) {
    return <main {...props} className={clsx("mt-12 flex-1", props.className)} />;
  }

  export function Footer() {
    const { O_VISAGE_STAGE, O_VISAGE_SUPPORTER } = useRegistry("env");
    const restrictedClient = useRegistry(RestrictedClient);
    const [busy, setBusy] = useState(false);
    const purge = () => {
      setBusy(true);
      restrictedClient.purge().then(() => location.reload());
    };
    const seed = () => {
      setBusy(true);
      restrictedClient.seed().then(() => location.reload());
    };
    return (
      <footer className="my-12 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          {O_VISAGE_SUPPORTER ? (
            <svg className="size-8 -mr-1 text-c-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <div className="size-6 aspect-square bg-c-accent rounded" />
          )}
          <div className="text-4xl font-extrabold italic pr-5">Visage</div>
        </div>
        <div className="italic -mt-3 pl-5">
          by{" "}
          <a href="https://www.butterhost.ing" target="_blank" rel="nooopener noreferrer" className="text-c-accent hover:text-c-dark-full">
            Butterhost.ing
          </a>
        </div>
        {O_VISAGE_STAGE === "development" && (
          <>
            {busy ? (
              <Spinner />
            ) : (
              <div className="flex gap-4">
                <button onClick={seed} className="cursor-pointer border border-c-dark-full bg-white hover:bg-purple-50 p-2 rounded-lg">
                  Seed
                </button>
                <button onClick={purge} className="cursor-pointer border border-c-dark-full bg-white hover:bg-purple-50 p-2 rounded-lg">
                  Purge
                </button>
              </div>
            )}
          </>
        )}
      </footer>
    );
  }
}
