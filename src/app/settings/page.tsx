import {
  CloudUpload,
  Download,
  FileText,
  Heart,
  LockKeyhole,
  Pencil,
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

const mentorSettings = [
  ["身体分析メンター", "身体の状態や傾向をデータに基づいて分析し、適切なコンディショニング提案をサポートします。", Sprout],
  ["寄り添い接客コーチ", "生徒さんへの心の寄り添いや接客・サポートの工夫をアドバイスし、関係性づくりを支援します。", Heart],
  ["レッスン設計＆ブランディング戦略家", "レッスン設計やクラス運営、発信・ブランディングの戦略をサポートします。", TrendingUp],
] as const;

const learningRows = [
  ["体調記録と傾向のつながりまとめ", "身体分析", "身体・寄り添い", "OCR済み", "2025/5/18"],
  ["リストラティブヨガ資料集", "レッスン設計", "レッスン設計", "要見直し", "2025/5/14"],
  ["肩まわりの解剖学メモ", "身体分析", "身体分析", "読み込み中", "2025/5/10"],
  ["生徒さまからの質問まとめ.xlsx", "Q&A", "寄り添い", "OCR済み", "2025/5/6"],
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="設定" subtitle="利用環境・AIメンター設定をまとめて管理" />

      <SoftCard className="p-6">
        <div className="grid grid-cols-[130px_1fr] gap-6">
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
              <Button className="h-10 rounded-lg bg-[#5d956d] px-10 text-white hover:bg-[#4f835d]">保存する</Button>
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
          <p className="mb-4 text-[13px] font-medium text-[#696d66]">あなたの記録や資料をAIメンターに学習させ、回答の精度を高めます。</p>
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
                <li>・生徒の傾向まとめ</li>
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
                <SelectTrigger className="h-9 w-full rounded-lg bg-white/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60分（1レッスン＝60分）</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="カレンダー表示">
              <Select defaultValue="week">
                <SelectTrigger className="h-9 w-full rounded-lg bg-white/80"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="week">週表示（時間帯グリッド）</SelectItem></SelectContent>
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
    </>
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
  icon: typeof Download;
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
