import Image from "next/image";

// Source: reference/brand/logo-green-white-no-bg.png (marketing's "leaf" lockup),
// cropped to its content bounding box — see the note in public/ if this is ever
// regenerated. Aspect ratio 1036:160.
const ASPECT_RATIO = 1036 / 160;

export function Logo({ className, height = 24 }: { className?: string; height?: number }) {
  return (
    <Image
      src="/panattoni-logo.png"
      alt="Panattoni"
      width={ASPECT_RATIO * height}
      height={height}
      className={className}
      priority
    />
  );
}
