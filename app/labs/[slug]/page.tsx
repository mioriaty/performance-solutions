import { notFound } from "next/navigation"
import { ALL_LABS, getLabBySlug } from "@/lib/labs/catalog"
import { LabWorkbench } from "@/components/labs/lab-workbench"

export function generateStaticParams() {
  return ALL_LABS.map((lab) => ({ slug: lab.slug }))
}

export default async function LabPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const lab = getLabBySlug(slug)

  if (!lab) {
    notFound()
  }

  return <LabWorkbench lab={lab} />
}
