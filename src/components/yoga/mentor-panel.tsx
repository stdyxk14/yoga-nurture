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
      "肩甲骨まわりの変化を次回も確認しましょう。",
      "小さな成功体験を言葉で返すと継続につながります。",
      "呼吸と姿勢改善を軸に、リラックス要素も入れましょう。",
    ],
  },
  "/lessons": {
    target: "このレッスンについて相談",
    advice: [
      "体幹の安定を保ちつつ、肩まわりも観察しましょう。",
      "後半は呼吸ガイドで安心感を補いましょう。",
      "体幹強化テーマはシリーズ化に向いています。",
    ],
  },
  "/reports": {
    target: "このレポートについて相談",
    advice: [
      "肩・首ケア需要が高く、継続導線に向いています。",
      "平日午前の強みを維持し、フォローを丁寧に。",
      "姿勢改善テーマを発信や講座化につなげましょう。",
    ],
  },
  "/settings": {
    target: "この設定について相談",
    advice: [
      "学習データは目的別に整理すると精度が上がります。",
      "接客方針を短く明文化しておくと安定します。",
      "対象生徒像を絞ると提案が具体化します。",
    ],
  },
  "/dashboard": {
    target: "相談する",
    advice: [
      "姿勢データは定期比較すると変化が見えます。",
      "レッスン後の一言が継続の力になります。",
      "季節テーマをSNSにも展開しましょう。",
    ],
  },
};

const mentors = [
  {
    title: "身体分析メンター",
    icon: Sprout,
    tint: "green",
    description: "身体傾向を分析し、改善のヒントを整理します。",
  },
  {
    title: "寄り添い接客コーチ",
    icon: Heart,
    tint: "coral",
    description: "声かけや関係づくりをサポートします。",
  },
  {
    title: "レッスン設計＆ブランディング戦略家",
    icon: TrendingUp,
    tint: "lavender",
    description: "レッスン設計と発信の方向性を整えます。",
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
    <aside className="sticky top-0 h-screen overflow-y-auto border-l border-[#e7dfd4] bg-[#fffdf9] px-2.5 py-2.5 shadow-[-8px_0_32px_rgba(111,92,71,0.06)]">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Sparkles className="h-6 w-6 text-[#37885a]" strokeWidth={1.7} />
        <div>
          <h2 className="text-[17px] font-bold leading-5">AIメンター</h2>
          <p className="text-[11px] font-medium text-[#7f786d]">いつでも相談できる成長パートナー</p>
        </div>
      </div>

      <div className="space-y-2">
        {mentors.map((mentor, index) => {
          const Icon = mentor.icon;
          const tint = tintClass[mentor.tint];

          return (
            <section
              key={mentor.title}
              className={cn("rounded-xl border p-2 shadow-[0_10px_20px_rgba(100,83,57,0.05)]", tint.card)}
            >
              <div className="flex gap-2.5">
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", tint.text)} strokeWidth={1.6} />
                <div>
                  <h3 className={cn("text-[13px] font-bold leading-5", tint.text)}>{mentor.title}</h3>
                  <p className="text-[11px] font-medium leading-4 text-[#5c625a]">{mentor.description}</p>
                </div>
              </div>
              <div className={cn("mt-2 rounded-lg border p-2", tint.soft)}>
                <p className={cn("text-[11px] font-bold", tint.text)}>今日のアドバイス</p>
                <p className="mt-0.5 text-[11px] font-medium leading-4 text-[#50564f]">{copy.advice[index]}</p>
              </div>
              <Button className={cn("mt-2 h-7 w-full rounded-lg text-[11px] text-white shadow-none", tint.button)}>
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                {copy.target}
              </Button>
            </section>
          );
        })}

        <Button className="h-9 w-full rounded-lg bg-[#6da07a] text-[13px] font-bold text-white hover:bg-[#5d906c]">
          <BotMessageSquare className="mr-2 h-4 w-4" />
          AIメンターにまとめて相談する
        </Button>
      </div>
    </aside>
  );
}
