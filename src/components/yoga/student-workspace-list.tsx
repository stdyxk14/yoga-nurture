"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Edit3, ExternalLink, ShieldAlert, UserRound } from "lucide-react";
import { restoreStudentAction } from "@/app/students/actions";
import { WorkspaceStatus, WorkspaceTableContainer } from "@/components/yoga/workspace-kit";

export type StudentWorkspaceListRow = {
  id: string;
  name: string;
  kana: string;
  caution: string;
  pendingFollowUpCount: number;
  attendedCount: number;
  lastLessonDate: string;
  nextLessonDate: string;
  archived: boolean;
};

export function StudentWorkspaceList({
  rows,
  selectedId,
  selectHrefs,
}: {
  rows: StudentWorkspaceListRow[];
  selectedId?: string;
  selectHrefs: Record<string, string>;
}) {
  const router = useRouter();

  return (
    <WorkspaceTableContainer>
      <table className="w-full min-w-[780px] border-collapse text-left text-[14px]">
        <thead className="bg-[#f5f3ee] text-[12px] font-semibold text-[#666d63]">
          <tr>
            <TableHead>生徒</TableHead>
            <TableHead>安全面の注意</TableHead>
            <TableHead>未完了フォロー</TableHead>
            <TableHead>受講回数</TableHead>
            <TableHead>最終受講</TableHead>
            <TableHead>次回予定</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ece5db]">
          {rows.map((student) => {
            const selected = student.id === selectedId;
            const selectHref = selectHrefs[student.id] ?? `/students?selected=${student.id}`;
            return (
              <tr
                key={student.id}
                tabIndex={0}
                aria-selected={selected}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("a,button,form,summary")) return;
                  router.push(selectHref);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(selectHref);
                  }
                }}
                className={selected ? "cursor-pointer bg-[#eef5eb] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6f9a76]" : "cursor-pointer transition hover:bg-[#fafcf8] focus-visible:bg-[#fafcf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6f9a76]"}
              >
                <TableCell>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f1e5] text-[#4f8058]"><UserRound className="h-4.5 w-4.5" /></span>
                    <div className="min-w-0"><p className="truncate font-semibold text-[#344038]">{student.name}</p><p className="truncate text-[12px] text-[#7b8178]">{student.kana || "ふりがな未登録"}</p></div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {student.caution.trim() ? <span className="flex items-start gap-1.5 text-[13px] text-[#a65348]"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><span className="line-clamp-2">{student.caution}</span></span> : <span className="text-[#7b8178]">登録なし</span>}
                </TableCell>
                <TableCell>{student.pendingFollowUpCount ? <WorkspaceStatus tone="coral">要対応 {student.pendingFollowUpCount}件</WorkspaceStatus> : <span className="text-[#687068]">なし</span>}</TableCell>
                <TableCell>{student.attendedCount}回</TableCell>
                <TableCell className="whitespace-nowrap">{student.lastLessonDate}</TableCell>
                <TableCell className="whitespace-nowrap">{student.nextLessonDate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {student.archived ? (
                      <form action={restoreStudentAction.bind(null, student.id)}><button className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#5d8f68] px-2.5 text-[12px] font-semibold text-white"><ArchiveRestore className="h-3.5 w-3.5" />復元</button></form>
                    ) : (
                      <>
                        <Link href={`/students/${student.id}`} className="secondary-row-action" aria-label={`${student.name}の詳細を開く`}><ExternalLink className="h-3.5 w-3.5" />詳細</Link>
                        <Link href={`/students/${student.id}/edit`} className="secondary-row-action" aria-label={`${student.name}を編集`}><Edit3 className="h-3.5 w-3.5" />編集</Link>
                      </>
                    )}
                  </div>
                </TableCell>
              </tr>
            );
          })}
        </tbody>
      </table>
    </WorkspaceTableContainer>
  );
}

function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th scope="col" className={`whitespace-nowrap px-3 py-3 ${className}`}>{children}</th>;
}

function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-middle text-[#3e453d] ${className}`}>{children}</td>;
}
