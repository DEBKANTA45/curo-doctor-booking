import { redirect } from "next/navigation";

// The booking flow now lives entirely on the doctor profile page
// (src/app/doctors/[slug]/page.tsx). This route is kept only so old
// links/bookmarks to /doctors/[slug]/book don't 404 — it just forwards
// straight to the merged page, carrying forward any ?type=video param.
export default function BookRedirectPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const type = typeof searchParams?.type === "string" ? `?type=${searchParams.type}` : "";
  redirect(`/doctors/${params.slug}${type}`);
}