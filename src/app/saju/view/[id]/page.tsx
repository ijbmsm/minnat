import { Nav } from "@/components/nav";
import { SajuPage } from "@/components/saju-page";

export const dynamic = "force-dynamic";

export default async function PublicSajuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Nav />
      <SajuPage readingId={id} publicApi />
    </>
  );
}
