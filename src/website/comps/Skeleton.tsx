import clsx from "clsx";
import { ComponentProps, useState } from "react";
import { Link, useLocation } from "react-router";
import { RestrictedClient } from "../clients/RestrictedClient";
import { useRegistry } from "../hooks/useRegistry";
import { Route } from "../Route";
import { Paper } from "./Paper";
import { useStackId } from "recharts/types/cartesian/BarStack";
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

    const navigationLinks = [
      { title: "Websites", link: Route.websites(), rounding: "left" },
      { title: "API", link: Route.api(), rounding: undefined },
      { title: "Data", link: Route.data(), rounding: "right" },
    ] as const;

    return (
      <Paper className="mt-10">
        <nav className="flex">
          {navigationLinks.map(({ title, link, rounding }) => (
            <Link
              key={title}
              to={link}
              className={clsx("p-6 hover:bg-c-primary/15", {
                "rounded-l-2xl": rounding === "left",
                "rounded-r-2xl": rounding === "right",
                "bg-c-primary/10": pathname.startsWith(link),
                "ml-auto": title === "API",
              })}
            >
              <span className="relative text-lg">{title}</span>
            </Link>
          ))}
        </nav>
      </Paper>
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
          <div className="text-4xl font-extrabold italic text-c-dark pr-5">Visage</div>
        </div>
        <div className="italic text-c-dark -mt-3 pl-5">
          by{" "}
          <a href="https://www.butterhost.ing" target="_blank" rel="nooopener noreferrer" className="text-c-accent hover:text-c-dark">
            Butterhost.ing
          </a>
        </div>
        {O_VISAGE_STAGE === "development" && (
          <>
            {busy ? (
              <Spinner />
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={seed}
                  className="cursor-pointer text-c-dark border border-c-dark bg-white hover:bg-purple-50 p-2 rounded-lg"
                >
                  Seed
                </button>
                <button
                  onClick={purge}
                  className="cursor-pointer text-c-dark border border-c-dark bg-white hover:bg-purple-50 p-2 rounded-lg"
                >
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
