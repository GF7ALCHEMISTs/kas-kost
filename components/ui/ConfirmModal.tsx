"use client";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal recap generik. Dipakai sebelum data benar-benar disimpan,
 * supaya user sempat mengecek ulang nominal & keterangan
 * ("Rp 450.000 - untuk Wifi bulan Juli. Sudah benar?").
 */
export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Ya, Simpan",
  cancelLabel = "Batal",
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-5 space-y-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-lg border dark:border-gray-800 font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
