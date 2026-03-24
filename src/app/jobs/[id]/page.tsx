import ApplicationDetailView from "@/components/jobs/ApplicationDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  return <ApplicationDetailView id={id} />;
}

export const dynamic = "force-dynamic";
