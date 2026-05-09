"use client";
import { useEffect, useState } from "react";
import { cleanupOrphanedStorageImages } from "@/lib/actions";
import { useToast } from "@/components/admin/Toast";

type BucketStat = {
  name: string;
  size: number;
  count: number;
  sizeFormatted: string;
};

type StorageData = {
  buckets: BucketStat[];
  total: {
    bytes: number;
    formatted: string;
    fileCount: number;
    limitBytes: number;
    limitFormatted: string;
    usagePercent: number;
  };
};

export default function StorageWidget() {
  const toast = useToast();
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cleaningUp, setCleaningUp] = useState(false);

  const refresh = () => {
    fetch("/api/admin/storage")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCleanup = async () => {
    if (!confirm("Scan storage and delete images not referenced by any product, category, or banner?\n\nThis cannot be undone.")) {
      return;
    }
    setCleaningUp(true);
    try {
      const result = await cleanupOrphanedStorageImages();
      if (result.deleted > 0) {
        toast.success(
          "Storage cleaned up",
          `Removed ${result.deleted} orphaned ${result.deleted === 1 ? "image" : "images"} (scanned ${result.scanned}).`
        );
      } else {
        toast.info(
          "Nothing to clean",
          `No orphans found. Scanned ${result.scanned} ${result.scanned === 1 ? "file" : "files"}.`
        );
      }
      if (result.errors.length > 0) {
        toast.error("Some deletes failed", result.errors[0]);
      }
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cleanup failed";
      toast.error("Cleanup failed", msg);
    } finally {
      setCleaningUp(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-12">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-4">Storage</p>
        <div className="bg-white border border-stone-100 rounded-lg p-6 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
          <p className="text-sm text-stone-400">Loading storage usage...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mb-12">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-4">Storage</p>
        <div className="bg-white border border-stone-100 rounded-lg p-6">
          <p className="text-sm text-stone-400">Could not load storage stats</p>
        </div>
      </div>
    );
  }

  const { total, buckets } = data;
  const usageColor =
    total.usagePercent >= 90
      ? "bg-red-500"
      : total.usagePercent >= 70
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="mb-12">
      <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-4">Storage</p>
      <div className="bg-white border border-stone-100 rounded-lg p-6">
        {/* Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-3xl font-light text-stone-900">
              {total.formatted}
              <span className="text-sm text-stone-400 font-normal ml-2">
                of {total.limitFormatted}
              </span>
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {total.fileCount} {total.fileCount === 1 ? "file" : "files"} across{" "}
              {buckets.length} {buckets.length === 1 ? "bucket" : "buckets"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-medium text-stone-800">{total.usagePercent}%</p>
            <p className="text-xs text-stone-400 tracking-widest uppercase">used</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
          <div
            className={`${usageColor} h-full transition-all duration-500`}
            style={{ width: `${Math.min(total.usagePercent, 100)}%` }}
          />
        </div>

        {/* Per-bucket breakdown */}
        {buckets.length > 0 && (
          <div className="mt-5 pt-5 border-t border-stone-100">
            <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">Buckets</p>
            <div className="space-y-2">
              {buckets.map((b) => (
                <div key={b.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-stone-700 font-medium truncate">{b.name}</span>
                    <span className="text-xs text-stone-400 whitespace-nowrap">
                      ({b.count} {b.count === 1 ? "file" : "files"})
                    </span>
                  </div>
                  <span className="text-stone-600 text-xs font-medium ml-3 whitespace-nowrap">
                    {b.sizeFormatted}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {total.usagePercent >= 70 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
            ⚠ Storage usage is{" "}
            {total.usagePercent >= 90 ? "critically high" : "getting high"}. Consider
            removing old/unused images.
          </div>
        )}

        {/* Cleanup Orphans button */}
        <div className="mt-5 pt-5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-stone-700 font-medium">Cleanup Orphaned Images</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Remove images not used by any product, style, or banner.
            </p>
          </div>
          <button
            onClick={handleCleanup}
            disabled={cleaningUp}
            className={`px-5 py-2.5 text-xs tracking-widest uppercase font-medium rounded transition-colors whitespace-nowrap ${
              cleaningUp
                ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                : "bg-stone-900 text-white hover:bg-stone-700"
            }`}
          >
            {cleaningUp ? "Scanning..." : "Run Cleanup"}
          </button>
        </div>
      </div>
    </div>
  );
}
