import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { cleanupExpiredOrders } from "@/lib/db";
import { cleanupExpiredUploads } from "@/lib/storage";

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const expiredOrdersCleaned = cleanupExpiredOrders();
  const expiredUploadsCleaned = cleanupExpiredUploads();

  return NextResponse.json({
    ok: true,
    expiredOrdersCleaned,
    expiredUploadsCleaned,
  });
}
