import * as Flags from "country-flag-icons/react/3x2";

type Props = {
  countryCode: string;
  className?: string;
};
export function CountryFlag({ countryCode, className }: Props) {
  const Flag = (Flags as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[countryCode];
  return Flag ? <Flag className={className} /> : null;
}
