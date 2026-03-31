import clsx from "clsx";
import { ComponentProps } from "react";

type Props = ComponentProps<"div"> & {
  borderClassName?: string;
};
export function Paper({ className, borderClassName, children, ...props }: Props) {
  return (
    <div className={clsx("bg-c-light rounded-2xl relative border border-black/20", className)} {...props}>
      {children}
    </div>
  );
}
