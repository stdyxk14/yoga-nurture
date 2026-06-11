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

const mentors = [
  {
    title: "身体分析メンター",
    icon: Sprout,
    tint: "green",
    description: "身体の特徴や傾向を整理し、改善のヒントを提案します。",
  },
  {
    title: "寄り添い接客コーチ",
    icon: Heart,
    tint: "coral",
    description: "声かけや関係づくりを、生徒目線でサポートします。",
  },
  {
    title: "レッスン設計＆ブランディング戦略家",
    icon: TrendingUp,
    tint: "lavender",
    description: "レッスン設計と発信の方向性を一緒に整えます。",
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

function resolveCopy(pathname: string) {
  if (pathname.includes("/record")) {
    return {
      target: "振り返りについて相談",
      advice: [
        "反応と体の変化を並べると、次回の改善点が見つかります。",
        "小さな成功体験も記録し、次の声かけにつなげましょう。",
        "満足度の高い流れは、次の企画や発信にも活かせます。",
      ],
    };
  }

  if (pathname === "/lessons/new" || pathname.includes("/edit") || pathname === "/schedules/new") {
    return {
      target: "事前プランについて相談",
      advice: [
        "参加生徒の注意点から、代替ポーズを先に用意しましょう。",
        "安心できる導入文を決めておくと、開始が滑らかになります。",
        "テーマとタグを揃えると、継続クラスとして育てやすくなります。",
      ],
    };
  }

  if (pathname === "/templates/new") {
    return {
      target: "テンプレート設計を相談",
      advice: [
        "基本構成は60分の流れで書くと、予定作成に使いやすくなります。",
        "注意点は禁忌だけでなく、声かけの工夫も残しましょう。",
        "タグを整えると、似たテーマの振り返りが探しやすくなります。",
      ],
    };
  }

  if (pathname.startsWith("/lessons")) {
    return {
      target: "このレッスン管理について相談",
      advice: [
        "予定、準備、記録の状態を分けると次の行動が明確になります。",
        "生徒ごとの配慮を事前に見ると、安心感のあるレッスンになります。",
        "記録済みの内容は、次回テーマの改善材料になります。",
      ],
    };
  }

  if (pathname.startsWith("/students")) {
    return {
      target: "この生徒について相談",
      advice: [
        "注意点と最近の変化を一緒に見ると、次回の配慮が決まります。",
        "小さな成功体験を言葉にすると、継続の後押しになります。",
        "好みのペースを記録して、無理のない提案につなげましょう。",
      ],
    };
  }

  if (pathname.startsWith("/reports")) {
    return {
      target: "このレポートについて相談",
      advice: [
        "伸びているテーマと悩みの増減を並べると改善策が見えます。",
        "参加が多い曜日や時間帯を、次の予定設計に活かしましょう。",
        "リピート率の高いクラスは発信テーマにも使えます。",
      ],
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      target: "この設定について相談",
      advice: [
        "学習データは目的別に整理すると回答精度が上がります。",
        "通知やリマインドは、運用に合わせて少なめから始めましょう。",
        "よく使う資料を入れると、相談の土台が安定します。",
      ],
    };
  }

  return {
    target: "相談する",
    advice: [
      "今日の予定と要フォロー生徒を見て、優先順位を決めましょう。",
      "レッスン後の一言記録が、次回の質を上げる材料になります。",
      "季節に合うテーマを週ごとに整えると、発信にもつながります。",
    ],
  };
}

export function MentorPanel() {
  const pathname = usePathname();
  const copy = resolveCopy(pathname);

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto border-l border-[#e7dfd4] bg-[#fffdf9] px-2.5 py-2.5 shadow-[-8px_0_32px_rgba(111,92,71,0.06)]">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Sparkles className="h-6 w-6 text-[#37885a]" strokeWidth={1.7} />
        <div>
          <h2 className="text-[17px] font-bold leading-5">AIメンター</h2>
          <p className="text-[11px] font-medium text-[#7f786d]">いつでも相談できる、あなたの成長パートナー</p>
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
