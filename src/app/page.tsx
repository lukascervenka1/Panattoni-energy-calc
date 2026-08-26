import { connection } from "next/server";
import { getCalculatorData } from "@/lib/data";
import { CalculatorPage } from "@/components/CalculatorPage";

export default async function Page() {
  // A CSP nonce is only meaningful per request (see src/proxy.ts), which
  // requires this page to render dynamically rather than once at build time.
  await connection();
  const { benchmarks, config } = await getCalculatorData();
  return <CalculatorPage benchmarks={benchmarks} config={config} />;
}
