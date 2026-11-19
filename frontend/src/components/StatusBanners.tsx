"use client";

import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";

interface StatusBannersProps {
  loading: boolean;
  progressMsg: string;
  error: string | null;
}

export default function StatusBanners({ loading, progressMsg, error }: StatusBannersProps) {
  return (
    <>
      {loading && progressMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 p-4 rounded-lg bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--accent-blue)]"
        >
          <Loader2 className="animate-spin" size={16} />
          <span className="text-sm font-semibold">{progressMsg}</span>
        </motion.div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-[var(--accent-red)]">
          <AlertCircle size={16} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}
    </>
  );
}
