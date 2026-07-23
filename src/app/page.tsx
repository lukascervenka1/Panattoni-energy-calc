import { getCalculatorData } from "@/lib/data";
import { CalculatorPage } from "@/components/CalculatorPage";

export default async function Page() {
  const { buildings, config } = await getCalculatorData();
  return <CalculatorPage buildings={buildings} config={config} />;
}
