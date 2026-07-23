export function Glow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full opacity-40"
      style={{
        background: "radial-gradient(circle, rgba(16,46,161,0.55) 0%, rgba(16,46,161,0) 70%)",
      }}
    />
  );
}
