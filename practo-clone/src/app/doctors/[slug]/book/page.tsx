import { redirect } from "next/navigation";

// The booking flow now lives entirely on the doctor profile page
// (src/app/doctors/[slug]/page.tsx). This route is kept only so old
// links/bookmarks to /doctors/[slug]/book don't 404 — it just forwards
// straight to the merged page.
export default function BookRedirectPage({ params }: { params: { slug: string } }) {
  redirect(`/doctors/${params.slug}`);
}