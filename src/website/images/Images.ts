import close from "./icons/close.svg";
import error from "./icons/error.svg";
import newSvg from "./icons/new.svg";
import play from "./icons/play.svg";
import success from "./icons/success.svg";
import trashcan from "./icons/trashcan.svg";
import warning from "./icons/warning.svg";

export namespace Images {
  export const Icon = {
    close,
    error,
    new: newSvg,
    play,
    success,
    trashcan,
    warning,
  } as const;
}
