import { getCalculatorData } from "@/lib/data";
import { CalculatorPage } from "@/components/CalculatorPage";

export default async function Page() {
  const { benchmarks, config } = await getCalculatorData();
  return <CalculatorPage benchmarks={benchmarks} config={config} />;
}
