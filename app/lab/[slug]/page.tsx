import { notFound } from "next/navigation";
import { experiments, findExperiment } from "@/lab/registry";
import { ExperimentView } from "./ExperimentView";

export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }));
}

export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = findExperiment(slug);
  if (!entry) notFound();
  return <ExperimentView slug={slug} />;
}
