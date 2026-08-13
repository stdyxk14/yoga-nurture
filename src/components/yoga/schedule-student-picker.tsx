"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Search, UserPlus, UsersRound, X } from "lucide-react";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createStudentFromScheduleAction,
  type QuickStudentFormState,
} from "@/app/students/actions";
import { Input } from "@/components/ui/input";
import { WorkspaceFeedback } from "@/components/yoga/workspace-kit";

type StudentOption = {
  id: string;
  name: string;
  kana: string;
};

export function ScheduleStudentPicker({
  initialStudents,
  initialSelectedIds,
}: {
  initialStudents: StudentOption[];
  initialSelectedIds: string[];
}) {
  const [students, setStudents] = useState(initialStudents);
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialSelectedIds));
  const [pinnedIds, setPinnedIds] = useState(() => new Set<string>());
  const [query, setQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);

  const visibleStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja");
    return students.filter((student) => {
      if (selectedOnly && !selectedIds.has(student.id)) return false;
      if (!normalizedQuery || pinnedIds.has(student.id)) return true;
      return `${student.name} ${student.kana}`.toLocaleLowerCase("ja").includes(normalizedQuery);
    });
  }, [pinnedIds, query, selectedIds, selectedOnly, students]);

  const toggleStudent = useCallback((studentId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }, []);

  const handleCreated = useCallback((student: StudentOption) => {
    setStudents((current) => current.some((item) => item.id === student.id) ? current : [student, ...current]);
    setSelectedIds((current) => new Set(current).add(student.id));
    setPinnedIds((current) => new Set(current).add(student.id));
  }, []);

  return (
    <div className="space-y-3">
      {Array.from(selectedIds).map((studentId) => (
        <input key={studentId} type="hidden" name="student_ids" value={studentId} />
      ))}

      <div className="flex flex-col gap-2 rounded-xl border border-[var(--yn-border)] bg-[#faf8f3] p-3 lg:flex-row lg:items-end lg:justify-between">
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-[12px] font-semibold text-[#656c63]">名前・ふりがなで検索</span>
          <span className="flex h-10 items-center gap-2 rounded-lg border border-[#dcd6cc] bg-white px-3">
            <Search className="h-4 w-4 shrink-0 text-[#777e74]" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="生徒名またはふりがな"
              className="h-8 border-0 px-0 text-[14px] shadow-none focus-visible:ring-0"
            />
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center rounded-lg bg-[#e8f1e5] px-3 text-[12px] font-semibold text-[#456d4c]">
            選択中 {selectedIds.size}名
          </span>
          <button
            type="button"
            aria-pressed={selectedOnly}
            onClick={() => setSelectedOnly((value) => !value)}
            className={selectedOnly
              ? "inline-flex h-9 items-center rounded-lg bg-[#5d8f68] px-3 text-[12px] font-semibold text-white"
              : "inline-flex h-9 items-center rounded-lg border border-[#d7ddd2] bg-white px-3 text-[12px] font-semibold text-[#59665b]"}
          >
            選択中だけ表示
          </button>
          <button
            type="button"
            disabled={!selectedIds.size}
            onClick={() => setSelectedIds(new Set())}
            className="inline-flex h-9 items-center rounded-lg border border-[#e4d6cf] bg-white px-3 text-[12px] font-semibold text-[#9a5e51] disabled:opacity-45"
          >
            選択をすべて解除
          </button>
          <QuickStudentDialog onCreated={handleCreated} />
        </div>
      </div>

      {visibleStudents.length ? (
        <div className="max-h-[390px] overflow-y-auto overscroll-contain rounded-xl border border-[var(--yn-border)] bg-[#faf8f3] p-2">
          <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
            {visibleStudents.map((student) => {
              const selected = selectedIds.has(student.id);
              return (
                <label
                  key={student.id}
                  className={selected
                    ? "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-[#8fb296] bg-[#f1f7ef] px-3 py-2"
                    : "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-transparent bg-white/85 px-3 py-2 transition hover:border-[#cbdac7]"}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleStudent(student.id)}
                    className="h-4 w-4 shrink-0 accent-[#5d8f68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f9a76]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[var(--yn-text)]">{student.name}</span>
                    <span className="block truncate text-[11px] text-[var(--yn-text-muted)]">{student.kana || "ふりがな未登録"}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#d9d3c9] bg-[#faf8f3] px-4 py-8 text-center">
          <UsersRound className="mx-auto h-6 w-6 text-[#849084]" aria-hidden="true" />
          <p className="mt-2 text-[13px] font-semibold text-[#59625a]">
            {students.length ? "条件に合う生徒はいません" : "生徒が登録されていません"}
          </p>
          <p className="mt-1 text-[12px] text-[#777e74]">この画面から新しい生徒を登録できます。</p>
        </div>
      )}
    </div>
  );
}

function QuickStudentDialog({ onCreated }: { onCreated: (student: StudentOption) => void }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<QuickStudentFormState, FormData>(createStudentFromScheduleAction, {});
  const handledStudentId = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.student || handledStudentId.current === state.student.id) return;
    handledStudentId.current = state.student.id;
    onCreated(state.student);
    formRef.current?.reset();
    setOpen(false);
  }, [onCreated, state.student]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#5d8f68] px-3 text-[12px] font-semibold text-white shadow-sm hover:bg-[#4e805a]"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        新しい生徒を登録
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-[#20251f]/45 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[91] flex items-center justify-center p-4">
          <Dialog.Popup className="w-full max-w-md rounded-xl border border-[#eadfd4] bg-[#fffdf9] shadow-[0_24px_70px_rgba(35,41,34,0.24)] outline-none">
            <div className="flex items-start justify-between gap-4 border-b border-[#e5e0d8] px-5 py-4">
              <div>
                <Dialog.Title className="text-[18px] font-semibold text-[#2f342e]">新しい生徒を登録</Dialog.Title>
                <Dialog.Description className="mt-1 text-[13px] leading-5 text-[#687068]">
                  詳しいプロフィールや注意点は、登録後に生徒カルテから追加できます
                </Dialog.Description>
              </div>
              <Dialog.Close type="button" className="yn-icon-button shrink-0" aria-label="閉じる">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <form ref={formRef} action={formAction} className="space-y-4 p-5">
              {state.error ? <WorkspaceFeedback tone="error">{state.error}</WorkspaceFeedback> : null}
              <label className="grid gap-1.5 text-[13px] font-semibold text-[#4f584e]">
                名前 <span className="text-[#bd5d50]">必須</span>
                <Input name="name" required autoFocus className="yn-control" />
              </label>
              <label className="grid gap-1.5 text-[13px] font-semibold text-[#4f584e]">
                ふりがな <span className="font-normal text-[#7b8178]">任意</span>
                <Input name="kana" className="yn-control" />
              </label>
              <div className="flex flex-col-reverse gap-2 border-t border-[#ece5db] pt-4 sm:flex-row sm:justify-end">
                <Dialog.Close type="button" className="inline-flex h-10 items-center justify-center rounded-lg border border-[#ddd6cc] bg-white px-4 text-[13px] font-semibold text-[#5f675d]">
                  キャンセル
                </Dialog.Close>
                <button disabled={pending} className="inline-flex h-10 items-center justify-center rounded-lg bg-[#5d8f68] px-4 text-[13px] font-semibold text-white disabled:opacity-55">
                  {pending ? "登録中…" : "登録して選択"}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
