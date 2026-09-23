import { redirect } from "next/navigation";

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/discover?v=${id}`);
}
