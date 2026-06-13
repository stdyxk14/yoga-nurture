import { Archive, BookOpenText, FolderTree, LogOut, Pencil, Plus, Sparkles, Trash2, UploadCloud, UserRound } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, SectionTitle, SoftCard } from "@/components/yoga/page-kit";
import {
  archiveBlockCategoryAction,
  archiveBlockSubcategoryAction,
  createBlockCategoryAction,
  createBlockSubcategoryAction,
  createDefaultBlockCategoriesAction,
  deleteBlockCategoryAction,
  deleteBlockSubcategoryAction,
  updateBlockCategoryAction,
  updateBlockSubcategoryAction,
} from "@/app/settings/block-category-actions";
import { updateAiSettingsAction, updateProfileAction } from "@/app/settings/profile-actions";
import { getAiSettings } from "@/lib/ai-settings";
import { getBlockCategories, type BlockCategory } from "@/lib/blocks";
import { getKnowledgeStats, type KnowledgeStats } from "@/lib/knowledge";
import { requireUserId } from "@/lib/students";

export const dynamic = "force-dynamic";

type SettingsSearchParams = {
  profileMessage?: string;
  profileError?: string;
  aiMessage?: string;
  aiError?: string;
  categoryMessage?: string;
  categoryError?: string;
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<SettingsSearchParams>;
}) {
  const params = await searchParams;
  const { supabase, userId, user } = await requireUserId();
  const [{ data: profile, error: profileError }, blockCategories, knowledgeStats] = await Promise.all([
    supabase.from("profiles").select("display_name,email").eq("id", userId).maybeSingle(),
    getBlockCategories(),
    getKnowledgeStats(),
  ]);
  const aiSettings = getAiSettings(user.user_metadata?.ai_settings);
  const email = profile?.email ?? user.email ?? "";
  const displayName = profile?.display_name ?? "";

  return (
    <div className="mx-auto w-full max-w-full space-y-4 overflow-x-hidden pb-24 md:pb-4">
      <PageHeader title="設定" subtitle="ユーザー情報とAIメンター設定を管理します" />

      {profileError ? <Notice tone="error" text={`ユーザー情報を取得できませんでした。${profileError.message}`} /> : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ProfileSettings email={email} displayName={displayName} message={params.profileMessage} error={params.profileError} />
        <AiSettingsPanel settings={aiSettings} message={params.aiMessage} error={params.aiError} />
      </section>

      <KnowledgeSettingsPanel stats={knowledgeStats} />

      <BlockCategoryManagement
        categories={blockCategories}
        notice={{
          message: params.categoryMessage,
          error: params.categoryError,
        }}
      />
    </div>
  );
}

function KnowledgeSettingsPanel({ stats }: { stats: KnowledgeStats }) {
  return (
    <SoftCard className="p-4 md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <SectionTitle icon={BookOpenText} title="AIメンター学習メモ" subtitle="手書きメモや指導ノートを知識として整理" />
          <p className="max-w-3xl text-[13px] font-semibold leading-6 text-[#667063]">
            手書きメモやPDFをアップロードし、読み取り結果を確認してからAIメンターが参照できる知識カードにします。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/settings/knowledge/upload"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#5d956d] px-4 text-[13px] font-bold text-white hover:bg-[#4f835d]"
          >
            <UploadCloud className="h-4 w-4" />
            手書きメモをアップロード
          </Link>
          <Link
            href="/settings/knowledge"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe7d9] bg-white/85 px-4 text-[13px] font-bold text-[#4f835d]"
          >
            学習メモ一覧を見る
          </Link>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KnowledgeMetric label="アップロード済みメモ" value={`${stats.documents}件`} />
        <KnowledgeMetric label="確認待ち" value={`${stats.reviewNeeded}件`} tone="beige" />
        <KnowledgeMetric label="有効化済み知識カード" value={`${stats.activeCards}件`} />
        <KnowledgeMetric label="エラー" value={`${stats.errors}件`} tone="red" />
      </div>
    </SoftCard>
  );
}

function KnowledgeMetric({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "beige" | "red" }) {
  const valueClass =
    tone === "red"
      ? "mt-1 text-[24px] font-extrabold text-[#d85f4d]"
      : tone === "beige"
        ? "mt-1 text-[24px] font-extrabold text-[#8b704c]"
        : "mt-1 text-[24px] font-extrabold text-[#4f835d]";

  return (
    <div className="rounded-2xl border border-[#eee4d8] bg-white/72 p-3">
      <p className="text-[12px] font-bold text-[#6d7469]">{label}</p>
      <p className={valueClass}>{value}</p>
    </div>
  );
}

function ProfileSettings({
  email,
  displayName,
  message,
  error,
}: {
  email: string;
  displayName: string;
  message?: string;
  error?: string;
}) {
  return (
    <SoftCard className="p-4 md:p-5">
      <SectionTitle icon={UserRound} title="ユーザー情報" subtitle="表示名だけ編集できます" />
      <NoticeFromParams message={message} error={error} />
      <form id="profile-settings-form" action={updateProfileAction} className="mt-4 grid gap-4">
        <Field label="メールアドレス">
          <Input value={email} readOnly className="h-11 rounded-xl border-[#ded7cb] bg-[#f7f4ee] text-[13px] font-semibold text-[#626960]" />
        </Field>
        <Field label="表示名">
          <Input name="display_name" defaultValue={displayName} placeholder="表示名を入力" className="h-11 rounded-xl border-[#ded7cb] bg-white/90 text-[14px]" />
        </Field>
      </form>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" form="profile-settings-form" className="h-10 rounded-xl bg-[#5d956d] px-6 text-white hover:bg-[#4f835d]">
          表示名を保存
        </Button>
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#e0d4c7] bg-white px-4 text-[13px] font-bold text-[#6b7468] sm:w-auto"
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </form>
      </div>
    </SoftCard>
  );
}

function AiSettingsPanel({
  settings,
  message,
  error,
}: {
  settings: ReturnType<typeof getAiSettings>;
  message?: string;
  error?: string;
}) {
  return (
    <SoftCard className="p-4 md:p-5">
      <SectionTitle icon={Sparkles} title="AIメンター設定" subtitle="必要なAI提案だけ表示できます" />
      <NoticeFromParams message={message} error={error} />
      <form action={updateAiSettingsAction} className="mt-4 grid gap-3">
        <ToggleRow name="ai_enabled" title="AIメンター機能を使う" description="OFFにすると、AI相談ボタンと各AI提案カードを非表示にします。" defaultChecked={settings.enabled} prominent />
        <div className="grid gap-2 md:grid-cols-2">
          <ToggleRow name="ai_student" title="生徒カルテAI提案" defaultChecked={settings.student} />
          <ToggleRow name="ai_lesson_plan" title="レッスンプランAI提案" defaultChecked={settings.lessonPlan} />
          <ToggleRow name="ai_block" title="ブロック原稿AI提案" defaultChecked={settings.block} />
          <ToggleRow name="ai_lesson_record" title="レッスン後振り返りAI提案" defaultChecked={settings.lessonRecord} />
        </div>
        <p className="rounded-2xl border border-[#eee4d8] bg-white/72 p-3 text-[12px] font-semibold leading-5 text-[#657064]">
          OFFにしても、これまでに生成したAI提案履歴は削除されません。
        </p>
        <Button type="submit" className="h-10 w-full rounded-xl bg-[#5d956d] text-white hover:bg-[#4f835d] sm:w-fit sm:px-6">
          AI設定を保存
        </Button>
      </form>
    </SoftCard>
  );
}

function BlockCategoryManagement({
  categories,
  notice,
}: {
  categories: BlockCategory[];
  notice: { message?: string; error?: string };
}) {
  const activeCategories = categories.filter((category) => !category.archived);
  const subcategories = categories.flatMap((category) =>
    category.subcategories.map((subcategory) => ({ ...subcategory, categoryName: category.name })),
  );

  return (
    <section id="block-categories" className="grid gap-4 xl:grid-cols-2">
      <SoftCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionTitle icon={FolderTree} title="大カテゴリー管理" subtitle="ブロックを探しやすくする分類です" />
          <form action={createDefaultBlockCategoriesAction}>
            <Button type="submit" className="h-9 rounded-xl bg-[#5d956d] text-[12px] text-white hover:bg-[#4f835d]">
              <Plus className="mr-1.5 h-4 w-4" />
              初期カテゴリー作成
            </Button>
          </form>
        </div>
        <NoticeFromParams message={notice.message} error={notice.error} />
        <form action={createBlockCategoryAction} className="mt-3 grid gap-2 rounded-2xl border border-[#eee4d8] bg-white/72 p-3 sm:grid-cols-[minmax(0,1fr)_96px_auto]">
          <Input name="name" placeholder="大カテゴリー名" className="h-10 rounded-xl bg-white/90 text-[13px]" />
          <Input name="sort_order" type="number" defaultValue="0" aria-label="表示順" className="h-10 rounded-xl bg-white/90 text-[13px]" />
          <Button type="submit" className="h-10 rounded-xl bg-[#5d956d] text-white hover:bg-[#4f835d]">追加</Button>
        </form>
        <div className="mt-3 grid gap-2">
          {categories.length ? categories.map((category) => (
            <article key={category.id} className="grid gap-2 rounded-2xl border border-[#eee4d8] bg-white/74 p-3">
              <form id={`category-${category.id}`} action={updateBlockCategoryAction.bind(null, category.id)} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_88px]">
                <div className="min-w-0">
                  <Input name="name" defaultValue={category.name} className="h-10 rounded-xl bg-white/90 text-[13px] font-bold" />
                  {category.archived ? <Badge className="mt-1 rounded-full bg-[#f0eee8] text-[#7c756b] shadow-none">アーカイブ中</Badge> : null}
                </div>
                <Input name="sort_order" type="number" defaultValue={category.sort_order} className="h-10 rounded-xl bg-white/90 text-[13px]" />
              </form>
              <ActionButtons formId={`category-${category.id}`} archiveAction={archiveBlockCategoryAction.bind(null, category.id)} deleteAction={deleteBlockCategoryAction.bind(null, category.id)} />
            </article>
          )) : (
            <EmptyState text="まだカテゴリーが登録されていません。初期カテゴリー作成ボタン、または追加フォームから登録できます。" />
          )}
        </div>
      </SoftCard>

      <SoftCard className="p-4">
        <SectionTitle icon={FolderTree} title="小カテゴリー管理" subtitle="大カテゴリーごとの細かい分類です" />
        <form action={createBlockSubcategoryAction} className="mt-3 grid gap-2 rounded-2xl border border-[#eee4d8] bg-white/72 p-3 sm:grid-cols-[150px_minmax(0,1fr)_88px_auto]">
          <select name="category_id" className="h-10 rounded-xl border border-input bg-white/90 px-3 text-[13px]">
            <option value="">大カテゴリーを選択</option>
            {activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <Input name="name" placeholder="小カテゴリー名" className="h-10 rounded-xl bg-white/90 text-[13px]" />
          <Input name="sort_order" type="number" defaultValue="0" aria-label="表示順" className="h-10 rounded-xl bg-white/90 text-[13px]" />
          <Button type="submit" disabled={!activeCategories.length} variant="outline" className="h-10 rounded-xl border-[#cfe1ca] bg-[#f8fcf6] text-[#5d956d]">
            追加
          </Button>
        </form>
        {!categories.length ? (
          <p className="mt-3 rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-3 text-[12px] font-semibold leading-5 text-[#657064]">
            先に大カテゴリーを登録してください。
          </p>
        ) : null}
        <div className="mt-3 grid gap-2">
          {subcategories.length ? subcategories.map((subcategory) => (
            <article key={subcategory.id} className="grid gap-2 rounded-2xl border border-[#eee4d8] bg-white/74 p-3">
              <form id={`subcategory-${subcategory.id}`} action={updateBlockSubcategoryAction.bind(null, subcategory.id)} className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)_88px]">
                <select name="category_id" defaultValue={subcategory.category_id} className="h-10 rounded-xl border border-input bg-white/90 px-3 text-[13px]">
                  {activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <div className="min-w-0">
                  <Input name="name" defaultValue={subcategory.name} className="h-10 rounded-xl bg-white/90 text-[13px] font-bold" />
                  <p className="mt-1 truncate text-[11px] font-semibold text-[#6d7469]">現在の大カテゴリー: {subcategory.categoryName}</p>
                  {subcategory.archived ? <Badge className="mt-1 rounded-full bg-[#f0eee8] text-[#7c756b] shadow-none">アーカイブ中</Badge> : null}
                </div>
                <Input name="sort_order" type="number" defaultValue={subcategory.sort_order} className="h-10 rounded-xl bg-white/90 text-[13px]" />
              </form>
              <ActionButtons formId={`subcategory-${subcategory.id}`} archiveAction={archiveBlockSubcategoryAction.bind(null, subcategory.id)} deleteAction={deleteBlockSubcategoryAction.bind(null, subcategory.id)} />
            </article>
          )) : categories.length ? (
            <EmptyState text="まだ小カテゴリーが登録されていません。大カテゴリーを選択して追加できます。" />
          ) : null}
        </div>
      </SoftCard>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] font-bold text-[#5f665c]">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({
  name,
  title,
  description,
  defaultChecked,
  prominent = false,
}: {
  name: string;
  title: string;
  description?: string;
  defaultChecked: boolean;
  prominent?: boolean;
}) {
  return (
    <label className={prominent ? "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#d8e3d4] bg-[#f8fcf6] p-3" : "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#eee4d8] bg-white/74 p-3"}>
      <span className="min-w-0">
        <span className="block text-[13px] font-extrabold text-[#394238]">{title}</span>
        {description ? <span className="mt-1 block text-[11px] font-semibold leading-5 text-[#657064]">{description}</span> : null}
      </span>
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
        <input name={name} type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-[#d9d3ca] transition peer-checked:bg-[#5d956d]" />
        <span className="relative ml-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function ActionButtons({
  formId,
  archiveAction,
  deleteAction,
}: {
  formId: string;
  archiveAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-end">
      <Button type="submit" form={formId} variant="outline" className="h-9 rounded-xl border-[#cfe1ca] bg-[#f8fcf6] text-[12px] text-[#5d956d]">
        <Pencil className="mr-1 h-3.5 w-3.5" />
        保存
      </Button>
      <form action={archiveAction}>
        <Button type="submit" variant="outline" className="h-9 w-full rounded-xl border-[#e3dbcf] bg-white text-[12px] text-[#6d716a]">
          <Archive className="mr-1 h-3.5 w-3.5" />
          保管
        </Button>
      </form>
      <form action={deleteAction}>
        <Button type="submit" variant="outline" className="h-9 w-full rounded-xl border-[#f0c7b4] bg-[#fff3ec] text-[12px] text-[#e46b50]">
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          削除
        </Button>
      </form>
    </div>
  );
}

function NoticeFromParams({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;
  return <Notice tone={error ? "error" : "success"} text={error ?? message ?? ""} />;
}

function Notice({ tone, text }: { tone: "success" | "error"; text: string }) {
  return (
    <p className={tone === "error" ? "mt-3 rounded-xl border border-[#f0c7b4] bg-[#fff3ec] px-3 py-2 text-[12px] font-bold text-[#d85f4d]" : "mt-3 rounded-xl border border-[#cfe1ca] bg-[#f8fcf6] px-3 py-2 text-[12px] font-bold text-[#4f7b58]"}>
      {text}
    </p>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8e3d4] bg-[#f8fcf6] p-4 text-center">
      <FolderTree className="mx-auto h-8 w-8 text-[#5d956d]" />
      <p className="mt-2 text-[12px] font-semibold leading-5 text-[#657064]">{text}</p>
    </div>
  );
}
