"use client";

import { usePathname } from "next/navigation";
import {
  BotMessageSquare,
  Heart,
  MessageCircle,
  Sparkles,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const screenCopy: Record<string, { target: string; advice: string[] }> = {
  "/students": {
    target: "この生徒について相談",
    advice: [
      "肩甲骨まわりの可動域が上向いています。猫背になりやすいため、胸を開く意識を継続しましょう。",
      "変化を実感できるとモチベーションが高まりやすいタイプです。小さな成功体験を積み重ねる声かけを意識しましょう。",
      "呼吸と姿勢改善をテーマにした構成が効果的です。リラックス要素も取り入れて満足度を高めましょう。",
    ],
  },
  "/lessons": {
    target: "このレッスンについて相談",
    advice: [
      "体幹の安定が高まり、バランスポーズが安定してきています。肩甲骨周りの動きもさらに意識してみましょう。",
      "後半の疲労が見られた生徒さんには、声かけや呼吸のガイドで安心感を届けましょう。",
      "テーマと実施内容が一致しており、満足度が高いレッスンです。体幹強化に特化したシリーズ化もおすすめです。",
    ],
  },
  "/reports": {
    target: "このレポートについて相談",
    advice: [
      "肩・首の悩みが全体の約6割を占めています。ケア系クラスを継続参加につなげましょう。",
      "リピート率が74%に上昇し、習慣化が進行中です。平日午前の強みを活かしていきましょう。",
      "姿勢改善テーマの満足度とリピート率が高く、シリーズ化や動画コンテンツ化に向いています。",
    ],
  },
  "/settings": {
    target: "この設定について相談",
    advice: [
      "背骨データを自然に保つと、より呼吸がしやすくなります。体幹を広く保ちましょう。",
      "やさしく共感的な声を意識すると、安心感のあるコミュニケーションにつながります。",
      "実践者層の設定を明確にすると、すぐに使える構成や声かけづくりがしやすくなります。",
    ],
  },
  "/dashboard": {
    target: "相談する",
    advice: [
      "生徒さんの姿勢データを定期的に比較することで、変化のパターンが見えやすくなります。",
      "レッスン後の一言メッセージが、安心感と継続の力になります。",
      "季節に合わせたテーマ設定をSNSでも発信すると、共感と予約につながります。",
    ],
  },
};

const mentors = [
  {
    title: "身体分析メンター",
    icon: Sprout,
    tint: "green",
    description: "身体の特徴や傾向をデータに基づいて分析し、改善や提案のヒントを整理します。",
  },
  {
    title: "寄り添い接客コーチ",
    icon: Heart,
    tint: "coral",
    description: "生徒さん一人ひとりに寄り添う接客やコミュニケーションをサポートします。",
  },
  {
    title: "レッスン設計＆ブランディング戦略家",
    icon: TrendingUp,
    tint: "lavender",
    description: "レッスンやクラス運営、発信とブランディングの戦略を整えます。",
  },
] as const;

const tintClass = {
  green: {
    card: "border-[#99b9a0] bg-[#eef7ee]",
    text: "text-[#3f7c52]",
    soft: "bg-white/80 border-[#dce9d8]",
    button: "bg-[#5d956d] hover:bg-[#4f835d]",
  },
  coral: {
    card: "border-[#f2b7a9] bg-[#fff0eb]",
    text: "text-[#ef654f]",
    soft: "bg-white/80 border-[#f5ddd4]",
    button: "bg-[#ef6f5b] hover:bg-[#df5c49]",
  },
  lavender: {
    card: "border-[#c8c2ea] bg-[#f2f0ff]",
    text: "text-[#7067bd]",
    soft: "bg-white/85 border-[#dfdcf4]",
    button: "bg-[#7469bf] hover:bg-[#655ab0]",
  },
};

export function MentorPanel() {
  const pathname = usePathname();
  const copy = screenCopy[pathname] ?? screenCopy["/dashboard"];

  return (
    <aside className="h-screen overflow-y-auto border-l border-[#e7dfd4] bg-[#fffdf9] px-3 py-4 shadow-[-8px_0_32px_rgba(111,92,71,0.06)] 2xl:px-4">
      <div className="mb-4 flex items-center gap-3 px-1">
        <Sparkles className="h-8 w-8 text-[#37885a]" strokeWidth={1.7} />
        <div>
          <h2 className="text-[20px] font-bold">AIメンター</h2>
          <p className="text-xs font-medium text-[#7f786d]">いつでも相談できる、あなたの成長パートナー</p>
        </div>
      </div>

      <div className="space-y-3">
        {mentors.map((mentor, index) => {
          const Icon = mentor.icon;
          const tint = tintClass[mentor.tint];

          return (
            <section
              key={mentor.title}
              className={cn("rounded-2xl border p-4 shadow-[0_12px_24px_rgba(100,83,57,0.06)]", tint.card)}
            >
              <div className="flex gap-3">
                <Icon className={cn("mt-1 h-8 w-8 shrink-0", tint.text)} strokeWidth={1.6} />
                <div>
                  <h3 className={cn("text-[18px] font-bold", tint.text)}>{mentor.title}</h3>
                  <p className="mt-2 text-[13px] font-medium leading-6 text-[#5c625a]">{mentor.description}</p>
                </div>
              </div>
              <div className={cn("mt-4 rounded-xl border p-3", tint.soft)}>
                <p className={cn("text-sm font-bold", tint.text)}>今日のアドバイス</p>
                <p className="mt-2 text-[13px] font-medium leading-6 text-[#50564f]">{copy.advice[index]}</p>
              </div>
              <Button className={cn("mt-3 h-9 w-full rounded-xl text-white shadow-none", tint.button)}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {copy.target}
              </Button>
            </section>
          );
        })}

        <Button className="h-12 w-full rounded-xl bg-[#6da07a] text-[16px] font-bold text-white hover:bg-[#5d906c]">
          <BotMessageSquare className="mr-2 h-5 w-5" />
          AIメンターにまとめて相談する
        </Button>
      </div>
    </aside>
  );
}
