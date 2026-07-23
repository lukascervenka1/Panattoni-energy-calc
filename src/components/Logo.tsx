import Image from "next/image";

export function Logo({ className, height = 24 }: { className?: string; height?: number }) {
  return (
    <Image
      src="/panattoni-logo.svg"
      alt="Panattoni"
      width={(168 / 28) * height}
      height={height}
      className={className}
      priority
    />
  );
}
