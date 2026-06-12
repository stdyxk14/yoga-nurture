import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  CloudUpload,
  Download,
  FileText,
  FolderTree,
  Heart,
  LockKeyhole,
  LogOut,
  Palette,
  Pencil,
  Plus,
  Settings2,
  ShieldCheck,
  Sprout,
  Trash2,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";

const mentorSettings: [string, string, LucideIcon][] = [
  ["身体分析メンター", "身体の状態を分析し、改善や提案のヒントを整理します。", Sprout],
  ["寄り添い接客コーチ", "声かけや関係づくりを、生徒目線でサポートします。", Heart],
  ["レッスン設計＆ブランディング戦略家", "レッスン設計と発信の方向性を一緒に整えます。", TrendingUp],
];

const learningRows = [
  ["体調記録と傾向のつながりまとめ", "身体分析", "身体・寄り添い", "OCR済み", "2025/5/18"],
  ["リストラティブヨガ資料集", "レッスン設計", "レッスン設計", "要見直し", "2025/5/14"],
  ["肩まわりの解剖学メモ", "身体分析", "身体分析", "読み込み中", "2025/5/10"],
  ["生徒さまからの質問まとめ.xlsx", "Q&A", "寄り添い", "OCR済み", "2025/5/6"],
];

const majorCategories = [
  { name: "事前準備", color: "#8fbf9a", icon: "clipboard", count: 8, archived: false },
  { name: "雑談", color: "#d9b98f", icon: "message", count: 5, archived: false },
  { name: "導入", color: "#7fb18a", icon: "leaf", count: 16, archived: false },
  { name: "呼吸法", color: "#92a7d8", icon: "wind", count: 21, archived: false },
  { name: "ウォーミングアップ", color: "#e0aa8f", icon: "sun", count: 18, archived: false },
  { name: "スーリャナマスカーラ", color: "#c99b6a", icon: "sunrise", count: 9, archived: false },
  { name: "立位", color: "#90b47b", icon: "standing", count: 32, archived: false },
  { name: "立位以外", color: "#a6a0d3", icon: "mat", count: 24, archived: false },
  { name: "ターゲットアーサナ", color: "#dd8d78", icon: "target", count: 14, archived: false },
  { name: "クールダウン", color: "#96b8bb", icon: "moon", count: 28, archived: false },
  { name: "クロージング", color: "#b8a68c", icon: "sparkles", count: 7, archived: false },
  { name: "その他", color: "#b7b7ae", icon: "more", count: 3, archived: true },
];

const minorGroups = [
  {
    major: "導入",
    minors: ["足指体操", "今日のテーマ説明", "怪我確認", "グラウンディング"],
  },
  {
    major: "呼吸法",
    minors: ["完全呼吸法", "片鼻呼吸", "胸式呼吸", "腹式呼吸"],
  },
  {
    major: "クールダウン",
    minors: ["首のストレッチ", "セツヴァンダサルヴァンガ", "ハラアーサナ", "ジャタラパリブルッタアーサナ", "シャヴァーサナ"],
  },
];

export default function SettingsPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileSettings />
      </div>

      <div className="hidden md:block">
      <PageHeader title="設定" subtitle="利用環境・AIメンター・ブロックカテゴリーをまとめて管理" />

      <SoftCard className="p-5">
        <div className="grid grid-cols-[120px_1fr] gap-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#e9f2e5] text-[#4f875a]">
            <UserRound className="h-16 w-16" strokeWidth={1.4} />
          </div>
          <div>
            <h2 className="mb-4 text-xl font-bold">基本アカウント設定</h2>
            <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-4">
              <Label className="pt-3 text-[14px] font-bold">表示名</Label>
              <Input defaultValue="松島 菜梨" className="h-11 rounded-lg border-[#ded7cb] bg-white/80" />
              <Label className="pt-3 text-[14px] font-bold">メールアドレス</Label>
              <Input defaultValue="maizaki.satomi@yoganurture.jp" className="h-11 rounded-lg border-[#ded7cb] bg-white/80" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[12px] font-medium text-[#696d66]">メールアドレスはログインや各種通知に使用されます。</p>
              <div className="flex items-center gap-2">
                <Link href="/auth/sign-out" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e0d4c7] bg-white px-4 text-[13px] font-bold text-[#6b7468]">
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </Link>
                <Button className="h-10 rounded-lg bg-[#5d956d] px-10 text-white hover:bg-[#4f835d]">保存する</Button>
              </div>
            </div>
          </div>
        </div>
      </SoftCard>

      <section className="mt-4 grid grid-cols-2 gap-4">
        <SoftCard>
          <h2 className="mb-2 text-xl font-bold">AIメンター設定</h2>
          <p className="mb-5 text-[13px] font-medium text-[#696d66]">各AIメンターの役割に応じた支援スタイルを設定します。</p>
          <div className="space-y-5">
            {mentorSettings.map(([title, description, Icon]) => (
              <div key={title} className="grid grid-cols-[48px_1fr_52px] items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf6ea] text-[#5d956d]">
                  <Icon className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <div>
                  <p className="text-[15px] font-bold">{title}</p>
                  <p className="mt-1 text-[12px] font-medium leading-5 text-[#60655e]">{description}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
          <Button className="mt-6 h-10 w-48 rounded-lg bg-[#5d956d] text-white hover:bg-[#4f835d]">
            <Settings2 className="mr-2 h-4 w-4" />
            設定を保存
          </Button>
        </SoftCard>

        <SoftCard>
          <h2 className="mb-2 text-xl font-bold">AIメンター学習管理</h2>
          <p className="mb-4 text-[13px] font-medium text-[#696d66]">手書きメモ、PDF、画像を読み込み、回答の精度を高める想定です。</p>
          <div className="mb-4 grid grid-cols-[1fr_210px] gap-4">
            <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-[#e4dbcf] bg-white/65">
              <CloudUpload className="mb-2 h-10 w-10 text-[#5d956d]" strokeWidth={1.5} />
              <p className="text-[14px] font-bold">手書きメモ / PDF / 画像をドラッグ＆ドロップ</p>
              <p className="my-1 text-[12px] font-medium text-[#6d7069]">または</p>
              <Button variant="outline" className="h-8 rounded-lg border-[#cfe1ca] bg-[#f8fcf6] text-[#5d956d]">ファイルを選択</Button>
            </div>
            <div className="rounded-xl border border-[#e4dbcf] bg-white/65 p-4">
              <p className="mb-2 text-[13px] font-bold">おすすめファイル</p>
              <ul className="space-y-1 text-[12px] font-medium leading-5">
                <li>・生徒傾向まとめ</li>
                <li>・レッスン記録 / アンケート</li>
                <li>・身体測定記録 / テストなど</li>
              </ul>
              <p className="mt-2 text-[12px] font-medium">対応形式：PDF / JPG / PNG</p>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>タイトル</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>対応メンター</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>更新日</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {learningRows.map(([title, category, mentor, status, date]) => (
                <TableRow key={title} className="soft-table-row">
                  <TableCell>{title}</TableCell>
                  <TableCell>{category}</TableCell>
                  <TableCell>{mentor}</TableCell>
                  <TableCell><StatusBadge status={status} /></TableCell>
                  <TableCell>{date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 text-[#6d716a]">
                      <Pencil className="h-4 w-4" />
                      <Trash2 className="h-4 w-4" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SoftCard>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-4">
        <SoftCard>
          <SectionTitle icon={Settings2} title="アプリ基本設定" />
          <div className="space-y-3">
            <SettingRow label="通知設定" note="レッスン予約・リマインドなどの通知を受け取ります">
              <Switch defaultChecked />
            </SettingRow>
            <SettingRow label="レッスン時間の基本単位">
              <Select defaultValue="60">
                <SelectTrigger className="h-9 w-full rounded-lg bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="60">60分（1レッスン＝60分）</SelectItem></SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="カレンダー表示">
              <Select defaultValue="month">
                <SelectTrigger className="h-9 w-full rounded-lg bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="month">月表示</SelectItem></SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="週の開始日">
              <Select defaultValue="monday">
                <SelectTrigger className="h-9 w-full rounded-lg bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="monday">月曜日</SelectItem></SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="タイムゾーン">
              <Select defaultValue="tokyo">
                <SelectTrigger className="h-9 w-full rounded-lg bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="tokyo">(GMT+09:00) 東京</SelectItem></SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="自動リマインド" note="レッスン前日にリマインドを自動送信">
              <Switch defaultChecked />
            </SettingRow>
          </div>
        </SoftCard>

        <SoftCard>
          <SectionTitle icon={ShieldCheck} title="データ管理・セキュリティ" />
          <div className="space-y-6">
            <SecurityRow icon={Download} title="データ出力" detail="生徒・レッスン・レポートなどのデータを出力します" button="データをエクスポート" />
            <SecurityRow icon={ShieldCheck} title="バックアップ状況" detail="最終バックアップ：2025/5/19 23:18" button="正常" />
            <SecurityRow icon={LockKeyhole} title="パスワード変更" detail="アカウントのパスワードを変更します" button="パスワードを変更" />
            <SecurityRow icon={FileText} title="アカウント情報" detail="アカウントの基本情報を確認・管理します" button="詳細を確認" />
          </div>
        </SoftCard>
      </section>

      <section id="block-categories" className="mt-4 grid grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-4">
        <SoftCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle icon={FolderTree} title="ブロックカテゴリー管理" subtitle="大カテゴリーは固定ではなく、変更できる想定" />
            <Button className="h-9 rounded-lg bg-[#5d956d] text-white hover:bg-[#4f835d]">
              <Plus className="mr-1.5 h-4 w-4" />
              大カテゴリーを追加
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#eee4d8] bg-white/72">
            <div className="grid grid-cols-[28px_1fr_92px_78px_68px_126px] gap-2 border-b border-[#eee4d8] bg-[#faf7ef] px-3 py-2 text-[11px] font-bold text-[#6b7468]">
              <span>色</span>
              <span>大カテゴリー名</span>
              <span>アイコン</span>
              <span>使用数</span>
              <span>表示順</span>
              <span className="text-right">操作</span>
            </div>
            {majorCategories.map((category) => (
              <div key={category.name} className="grid grid-cols-[28px_1fr_92px_78px_68px_126px] items-center gap-2 border-b border-[#eee4d8] px-3 py-2 last:border-b-0">
                <span className="h-5 w-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: category.color }} />
                <div className="min-w-0">
                  <Input defaultValue={category.name} className="h-8 bg-white/80 text-[13px] font-bold" />
                  {category.archived ? <Badge className="mt-1 rounded-full bg-[#f0eee8] text-[#7c756b] shadow-none">アーカイブ中</Badge> : null}
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-[#e3dbcf] bg-white/80 px-2 py-1 text-[11px] font-bold text-[#5f665c]">
                  <Palette className="h-3.5 w-3.5" />
                  {category.icon}
                </div>
                <span className="text-[12px] font-bold text-[#4f7b58]">{category.count}個</span>
                <div className="flex gap-1">
                  <button className="h-7 w-7 rounded-lg border border-[#d8e3d4] bg-white text-[#4f7b58]" aria-label="上へ"><ArrowUp className="mx-auto h-3.5 w-3.5" /></button>
                  <button className="h-7 w-7 rounded-lg border border-[#d8e3d4] bg-white text-[#4f7b58]" aria-label="下へ"><ArrowDown className="mx-auto h-3.5 w-3.5" /></button>
                </div>
                <div className="flex justify-end gap-1 text-[#6d716a]">
                  <button className="h-7 w-7 rounded-lg border border-[#e3dbcf] bg-white" aria-label="編集"><Pencil className="mx-auto h-3.5 w-3.5" /></button>
                  <button className="h-7 w-7 rounded-lg border border-[#e3dbcf] bg-white" aria-label="アーカイブ"><Archive className="mx-auto h-3.5 w-3.5" /></button>
                  <button className="h-7 w-7 rounded-lg border border-[#f0c7b4] bg-[#fff3ec] text-[#e46b50]" aria-label="削除"><Trash2 className="mx-auto h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 rounded-xl bg-[#fff7e8] px-3 py-2 text-[12px] font-medium leading-5 text-[#80633c]">
            すでにブロックに使われている大カテゴリーは、完全削除ではなく「アーカイブ」または「別カテゴリーへ付け替えてから削除」する想定です。
          </p>
        </SoftCard>

        <SoftCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle icon={FolderTree} title="小カテゴリー管理" subtitle="大カテゴリーごとに追加・編集・並び替え" />
            <Button variant="outline" className="h-9 rounded-lg border-[#cfe1ca] bg-[#f8fcf6] text-[#5d956d]">
              <Plus className="mr-1.5 h-4 w-4" />
              小カテゴリーを追加
            </Button>
          </div>

          <div className="grid gap-3">
            {minorGroups.map((group) => (
              <div key={group.major} className="rounded-xl border border-[#eee4d8] bg-white/70 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[14px] font-extrabold text-[#4f7b58]">{group.major}</p>
                  <Select defaultValue={group.major}>
                    <SelectTrigger className="h-8 w-40 rounded-lg bg-white/80 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {majorCategories.slice(0, 10).map((category) => (
                        <SelectItem key={category.name} value={category.name}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  {group.minors.map((minor, index) => (
                    <div key={minor} className="grid grid-cols-[1fr_68px_112px] items-center gap-2 rounded-lg border border-[#eee4d8] bg-white/78 px-2 py-2">
                      <Input defaultValue={minor} className="h-8 bg-white/80 text-[13px] font-bold" />
                      <div className="flex gap-1">
                        <button className="h-7 w-7 rounded-lg border border-[#d8e3d4] bg-white text-[#4f7b58]" aria-label="上へ"><ArrowUp className="mx-auto h-3.5 w-3.5" /></button>
                        <button className="h-7 w-7 rounded-lg border border-[#d8e3d4] bg-white text-[#4f7b58]" aria-label="下へ"><ArrowDown className="mx-auto h-3.5 w-3.5" /></button>
                      </div>
                      <div className="flex justify-end gap-1">
                        <button className="h-7 w-7 rounded-lg border border-[#e3dbcf] bg-white text-[#6d716a]" aria-label="編集"><Pencil className="mx-auto h-3.5 w-3.5" /></button>
                        <button className="h-7 w-7 rounded-lg border border-[#e3dbcf] bg-white text-[#6d716a]" aria-label="アーカイブ"><Archive className="mx-auto h-3.5 w-3.5" /></button>
                        <button className="h-7 w-7 rounded-lg border border-[#f0c7b4] bg-[#fff3ec] text-[#e46b50]" aria-label="削除"><Trash2 className="mx-auto h-3.5 w-3.5" /></button>
                      </div>
                      {index === group.minors.length - 1 ? (
                        <p className="col-span-3 text-[11px] font-medium text-[#7c8476]">使用中の場合はアーカイブ、または付け替え後に削除します。</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SoftCard>
      </section>
      </div>
    </>
  );
}

function MobileSettings() {
  return (
    <div className="mx-auto max-w-[430px] space-y-4 overflow-x-hidden">
      <div className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_12px_26px_rgba(122,104,80,0.08)]">
        <h1 className="text-[22px] font-extrabold tracking-normal">設定</h1>
        <p className="mt-1 text-[12px] font-semibold text-[#6d7469]">利用環境とカテゴリーを管理</p>
      </div>

      <MobileSettingCard title="基本アカウント設定" icon={UserRound}>
        <div className="space-y-3">
          <label className="grid gap-1 text-[12px] font-bold text-[#5f665c]">
            表示名
            <Input defaultValue="松島 菜梨" className="h-10 rounded-xl border-[#ded7cb] bg-white/90 text-[13px]" />
          </label>
          <label className="grid gap-1 text-[12px] font-bold text-[#5f665c]">
            メールアドレス
            <Input defaultValue="maizaki.satomi@yoganurture.jp" className="h-10 rounded-xl border-[#ded7cb] bg-white/90 text-[13px]" />
          </label>
          <Button className="h-10 w-full rounded-xl bg-[#5d956d] text-white hover:bg-[#4f835d]">保存する</Button>
          <Link href="/auth/sign-out" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#e0d4c7] bg-white text-[13px] font-bold text-[#6b7468]">
            <LogOut className="h-4 w-4" />
            ログアウト
          </Link>
        </div>
      </MobileSettingCard>

      <MobileSettingCard title="AIメンター設定" icon={Sprout}>
        <div className="space-y-3">
          {mentorSettings.map(([title, description, Icon]) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl border border-[#eee4d8] bg-white/72 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf6ea] text-[#5d956d]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-extrabold">{title}</p>
                <p className="line-clamp-1 text-[11px] font-semibold text-[#6d7469]">{description}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </MobileSettingCard>

      <MobileSettingCard title="アプリ基本設定" icon={Settings2}>
        <div className="grid gap-3 text-[13px] font-bold text-[#4b5148]">
          <MobileSelectRow label="レッスン時間" value="60分（1レッスン＝60分）" />
          <MobileSelectRow label="カレンダー表示" value="月表示" />
          <MobileSelectRow label="週の開始日" value="月曜日" />
          <MobileSelectRow label="タイムゾーン" value="東京（GMT+09:00）" />
          <div className="flex items-center justify-between rounded-2xl border border-[#eee4d8] bg-white/74 px-3 py-2.5">
            <span>自動リマインド</span>
            <Switch defaultChecked />
          </div>
        </div>
      </MobileSettingCard>

      <MobileSettingCard title="ブロックカテゴリー管理" icon={FolderTree}>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Button className="h-10 rounded-xl bg-[#5d956d] text-[12px] text-white hover:bg-[#4f835d]">
            <Plus className="mr-1 h-4 w-4" />
            大カテゴリー追加
          </Button>
          <Button variant="outline" className="h-10 rounded-xl border-[#cfe1ca] bg-[#f8fcf6] text-[12px] text-[#5d956d]">
            <Plus className="mr-1 h-4 w-4" />
            小カテゴリー追加
          </Button>
        </div>
        <div className="space-y-2">
          {majorCategories.slice(0, 6).map((category) => (
            <div key={category.name} className="flex items-center gap-2 rounded-2xl border border-[#eee4d8] bg-white/74 p-2.5">
              <span className="h-4 w-4 shrink-0 rounded-full border border-white shadow-sm" style={{ backgroundColor: category.color }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-extrabold">{category.name}</p>
                <p className="text-[11px] font-semibold text-[#6d7469]">{category.count}個のブロック</p>
              </div>
              <div className="flex gap-1">
                <button className="h-8 w-8 rounded-lg border border-[#d8e3d4] bg-white text-[#4f7b58]" aria-label="上へ"><ArrowUp className="mx-auto h-3.5 w-3.5" /></button>
                <button className="h-8 w-8 rounded-lg border border-[#e3dbcf] bg-white text-[#6d716a]" aria-label="編集"><Pencil className="mx-auto h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-2xl bg-[#fff7e8] px-3 py-2 text-[11px] font-semibold leading-5 text-[#80633c]">
          使用中のカテゴリーは、アーカイブまたは別カテゴリーへ付け替えてから削除する想定です。
        </p>
      </MobileSettingCard>

      <MobileSettingCard title="データ管理" icon={ShieldCheck}>
        <div className="grid gap-2">
          {[
            ["データ出力", "生徒・レッスン・レポートを出力"],
            ["バックアップ状況", "最終バックアップ：2025/5/19 23:18"],
            ["パスワード変更", "アカウントのパスワードを変更"],
          ].map(([title, detail]) => (
            <button key={title} className="flex items-center justify-between rounded-2xl border border-[#eee4d8] bg-white/74 px-3 py-3 text-left">
              <span>
                <span className="block text-[13px] font-extrabold">{title}</span>
                <span className="line-clamp-1 text-[11px] font-semibold text-[#6d7469]">{detail}</span>
              </span>
              <span className="text-[18px] text-[#8aa17d]">›</span>
            </button>
          ))}
        </div>
      </MobileSettingCard>
    </div>
  );
}

function MobileSettingCard({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-[#eee4d8] bg-white/84 p-4 shadow-[0_10px_24px_rgba(122,104,80,0.07)]">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf6ea] text-[#5d956d]">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-[16px] font-extrabold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MobileSelectRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee4d8] bg-white/74 px-3 py-2.5">
      <span className="shrink-0">{label}</span>
      <span className="truncate text-[12px] text-[#6d7469]">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "OCR済み"
      ? "border-[#b7d7b6] bg-[#eef8ee] text-[#438456]"
      : status === "要見直し"
        ? "border-[#f2d2a2] bg-[#fff7e8] text-[#b87522]"
        : "border-[#f3c7aa] bg-[#fff0e7] text-[#e26b4d]";

  return <Badge className={`rounded-full border px-3 py-1 shadow-none ${classes}`}>{status}</Badge>;
}

function SettingRow({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-10 grid-cols-[170px_1fr] items-center gap-4">
      <div>
        <p className="text-[14px] font-bold">{label}</p>
        {note ? <p className="mt-1 text-[11px] font-medium text-[#6b7068]">{note}</p> : null}
      </div>
      <div className="flex justify-end">{children}</div>
    </div>
  );
}

function SecurityRow({
  icon: Icon,
  title,
  detail,
  button,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  button: string;
}) {
  return (
    <div className="grid grid-cols-[34px_150px_1fr_170px] items-center gap-3">
      <Icon className="h-5 w-5 text-[#5d956d]" />
      <p className="text-[14px] font-bold">{title}</p>
      <p className="text-[13px] font-medium text-[#626960]">{detail}</p>
      <Button variant="outline" className="h-9 rounded-lg border-[#cfe1ca] bg-[#f8fcf6] text-[#5d956d]">{button}</Button>
    </div>
  );
}
