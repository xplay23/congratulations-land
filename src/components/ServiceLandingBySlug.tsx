"use client";

import { ServiceLandingView } from "@/components/ServiceLandingView";
import { getServiceLandingBySlug } from "@/lib/site-content";

export function ServiceLandingBySlug({ slug }: { slug: string }) {
  const item = getServiceLandingBySlug(slug);
  if (!item) return null;
  return <ServiceLandingView item={item} />;
}
