import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminUser } from "@/lib/admin-check";

const FREE_TIER_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function getFolderSize(bucket: string, prefix = ""): Promise<{ size: number; count: number }> {
  let total = 0;
  let count = 0;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });

  if (error || !data) return { size: 0, count: 0 };

  for (const item of data) {
    if (item.id === null) {
      // It's a folder — recurse
      const sub = await getFolderSize(bucket, prefix ? `${prefix}/${item.name}` : item.name);
      total += sub.size;
      count += sub.count;
    } else {
      // It's a file
      const fileSize = (item.metadata?.size as number) ?? 0;
      total += fileSize;
      count += 1;
    }
  }

  return { size: total, count };
}

export async function GET() {
  // Require authenticated admin
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdminUser(user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // List all buckets
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    if (bucketError || !buckets) {
      return NextResponse.json({ error: "Failed to list buckets" }, { status: 500 });
    }

    const bucketStats: { name: string; size: number; count: number; sizeFormatted: string }[] = [];
    let totalBytes = 0;
    let totalFiles = 0;

    for (const bucket of buckets) {
      const { size, count } = await getFolderSize(bucket.name);
      bucketStats.push({
        name: bucket.name,
        size,
        count,
        sizeFormatted: formatBytes(size),
      });
      totalBytes += size;
      totalFiles += count;
    }

    return NextResponse.json({
      buckets: bucketStats,
      total: {
        bytes: totalBytes,
        formatted: formatBytes(totalBytes),
        fileCount: totalFiles,
        limitBytes: FREE_TIER_LIMIT_BYTES,
        limitFormatted: formatBytes(FREE_TIER_LIMIT_BYTES),
        usagePercent: Math.round((totalBytes / FREE_TIER_LIMIT_BYTES) * 100),
      },
    });
  } catch (err) {
    console.error("Storage API error:", err);
    return NextResponse.json({ error: "Failed to fetch storage" }, { status: 500 });
  }
}
