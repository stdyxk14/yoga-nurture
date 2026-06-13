import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KnowledgeUploadForm } from "@/components/yoga/knowledge-upload-form";
import { PageHeader, SoftCard } from "@/components/yoga/page-kit";

export const dynamic = "force-dynamic";

export default function KnowledgeUploadPage() {
  return (
    <div className="mx-auto w-full max-w-full space-y-4 overflow-x-hidden pb-24 md:pb-4">
      <PageHeader title="手書きメモをアップロード" subtitle="画像・PDF・テキストをAIメンター用の知識候補として保存します" />
      <Link
        href="/settings/knowledge"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe7d9] bg-white/85 px-4 text-[13px] font-bold text-[#4f835d]"
      >
        <ArrowLeft className="h-4 w-4" />
        学習メモ一覧に戻る
      </Link>
      <SoftCard className="p-4 text-[13px] font-semibold leading-6 text-[#626960]">
        OCRは誤認識がある前提です。アップロード後は必ず読み取り結果を確認し、必要に応じて修正してから知識カード化してください。
      </SoftCard>
      <KnowledgeUploadForm />
    </div>
  );
}
