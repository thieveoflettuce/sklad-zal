import { filledCellIds } from "@/lib/catalog";
import { CellPageClient } from "./CellPageClient";

export function generateStaticParams() {
  return filledCellIds().map((id) => ({ id }));
}

export default async function CellPage({
  params,
}: PageProps<"/yacheyka/[id]">) {
  const { id } = await params;
  return <CellPageClient id={id} />;
}
