"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatRupiah } from "@/lib/utils/currency";
import type { ExpenseCategory, Profile, Expense } from "@/types/database.types";

interface ExpenseFormProps {
  periodId: string;
  currentUserId: string;
  categories: ExpenseCategory[];
  profiles: Profile[]; // penghuni aktif, untuk pilihan "dibayar oleh siapa"
  /** Kalau diisi, form berjalan dalam mode EDIT (wajib isi alasan edit -> audit log) */
  existingExpense?: Expense;
  /** Signed URL foto bukti yang SUDAH ada (mode edit), untuk ditampilkan sebagai preview */
  existingProofUrl?: string | null;
  /** Saldo kas saat ini (sebelum pengeluaran ini disimpan), untuk warning kalau bakal minus */
  currentBalance?: number;
}

export function ExpenseForm({
  periodId,
  currentUserId,
  categories,
  profiles,
  existingExpense,
  existingProofUrl,
  currentBalance,
}: ExpenseFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditMode = Boolean(existingExpense);

  const [categoryId, setCategoryId] = useState(existingExpense?.category_id ?? categories[0]?.id ?? "");
  const [amount, setAmount] = useState(existingExpense?.amount ?? 0);
  const [expenseDate, setExpenseDate] = useState(
    existingExpense?.expense_date ?? new Date().toISOString().slice(0, 10)
  );
  const [paidBy, setPaidBy] = useState(existingExpense?.paid_by ?? currentUserId);
  const [description, setDescription] = useState(existingExpense?.description ?? "");
  const [editReason, setEditReason] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const projectedBalance =
    !isEditMode && currentBalance !== undefined ? currentBalance - amount : null;
  const willGoNegative = projectedBalance !== null && projectedBalance < 0;

  async function uploadProofIfAny(): Promise<string | null> {
    if (!proofFile) return existingExpense?.proof_path ?? null;

    const compressed = await imageCompression(proofFile, {
      maxSizeMB: 0.7,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });

    const fileName = `expenses/${periodId}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("proofs")
      .upload(fileName, compressed, { contentType: "image/jpeg" });

    if (uploadError) throw uploadError;
    return fileName;
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const proofPath = await uploadProofIfAny();

      if (isEditMode && existingExpense) {
        if (!editReason.trim()) {
          throw new Error("Alasan edit wajib diisi.");
        }

        const { error: updateError } = await supabase
          .from("expenses")
          .update({
            category_id: categoryId,
            amount,
            expense_date: expenseDate,
            paid_by: paidBy,
            description,
            proof_path: proofPath,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingExpense.id);
        if (updateError) throw updateError;

        // Catat ke audit log: nominal lama -> baru, siapa, kenapa.
        // Wajib, supaya perubahan tidak pernah diam-diam.
        await supabase.from("audit_logs").insert({
          table_name: "expenses",
          record_id: existingExpense.id,
          action: "edit",
          old_data: { amount: existingExpense.amount, description: existingExpense.description },
          new_data: { amount, description },
          edit_reason: editReason,
          performed_by: currentUserId,
        });
      } else {
        const { error: insertError } = await supabase.from("expenses").insert({
          period_id: periodId,
          category_id: categoryId,
          amount,
          expense_date: expenseDate,
          paid_by: paidBy,
          description,
          proof_path: proofPath,
          status: "active", // auto-acc, tanpa approval
          created_by: currentUserId,
        });
        if (insertError) throw insertError;
      }

      router.push("/pengeluaran");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
      setShowRecap(false);
    }
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!description.trim() || amount <= 0) {
            setError("Nominal dan keterangan wajib diisi.");
            return;
          }
          setError(null);
          setShowRecap(true);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Kategori</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nominal</label>
          <CurrencyInput value={amount} onChange={setAmount} required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tanggal</label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Dibayar oleh</label>
          <select
            value={paidBy ?? ""}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Untuk apa (keterangan)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: bayar wifi bulan Juli"
            className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bukti (foto struk/transfer)</label>
          {existingProofUrl && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bukti saat ini:</p>
              <a href={existingProofUrl} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={existingProofUrl}
                  alt="Bukti pengeluaran saat ini"
                  className="rounded-lg max-h-72 w-full object-contain bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                />
              </a>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Pencet foto untuk buka ukuran asli. Pilih file baru di bawah ini kalau mau
                menggantinya. Kalau tidak, foto ini tetap dipakai.
              </p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-700 dark:text-gray-200 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-gray-800 dark:file:text-gray-100 dark:hover:file:bg-gray-700"
          />
        </div>

        {isEditMode && (
          <div>
            <label className="block text-sm font-medium mb-1 text-orange-600">
              Alasan edit (wajib, tercatat di riwayat)
            </label>
            <input
              type="text"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Contoh: salah tulis, harusnya 450rb bukan 4.5jt"
              className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium"
        >
          Lanjut
        </button>
      </form>

      <ConfirmModal
        open={showRecap}
        title="Cek dulu sebelum disimpan"
        loading={loading}
        onCancel={() => setShowRecap(false)}
        onConfirm={handleSave}
      >
        <p>
          <span className="font-semibold">{formatRupiah(amount)}</span> — untuk{" "}
          <span className="font-semibold">{description || "(belum diisi)"}</span>
          <br />
          Kategori: {selectedCategory?.name} · Tanggal: {expenseDate}
        </p>
        {willGoNegative && (
          <p className="mt-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
            ⚠️ Saldo kas bakal jadi{" "}
            <span className="font-semibold">{formatRupiah(projectedBalance!)}</span> (minus)
            setelah pengeluaran ini. Boleh tetap lanjut kalau memang mendesak, tapi kekurangannya
            akan tercatat dan terbawa ke bulan depan.
          </p>
        )}
        <p className="mt-2 text-gray-500 dark:text-gray-400">Sudah benar?</p>
      </ConfirmModal>
    </>
  );
}
