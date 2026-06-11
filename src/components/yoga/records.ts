export type StudentRecord = {
  id: string;
  name: string;
  kana: string;
  age: number;
  experience: string;
  caution: string;
  memo: string;
  lastLessonDate: string;
  linkedLessonCount: number;
  status: "recent" | "follow" | "caution";
};

export type LessonStatus = "予定" | "事前準備中" | "事前準備済み" | "記録待ち" | "記録済み";
export type LessonFormat = "パーソナル" | "グループ" | "オンライン";

export type LessonTemplate = {
  id: string;
  name: string;
  theme: string;
  tags: string[];
  structure: string;
  cautions: string;
};

export type LessonRecord = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  place: string;
  format: LessonFormat;
  theme: string;
  tags: string[];
  participants: number;
  templateId: string;
  templateName: string;
  status: LessonStatus;
  prePlan: string;
  preFocus: string;
  studentCare: string;
  actualContent: string;
  reaction: string;
  individualMemos: string;
  improvement: string;
};

export type LessonSchedule = {
  id: string;
  date: string;
  time: string;
  lessonName: string;
  templateId: string;
  place: string;
  format: LessonFormat;
  participantCount: number;
  status: LessonStatus;
  nextAction: string;
  lessonId?: string;
};

export type LessonRecordSummary = {
  id: string;
  date: string;
  lessonName: string;
  participantCount: number;
  tags: string[];
  status: LessonStatus;
  summary: string;
  reaction: string;
  improvement: string;
};

export const students: StudentRecord[] = [
  {
    id: "sato-misaki",
    name: "佐藤 美咲",
    kana: "さとう みさき",
    age: 35,
    experience: "ヨガ約3年、ピラティス経験あり",
    caution: "膝に違和感あり。深い後屈は避ける",
    memo: "呼吸を重視したゆったりフローが好み。変化を実感すると継続しやすい",
    lastLessonDate: "2025/5/18",
    linkedLessonCount: 18,
    status: "recent",
  },
  {
    id: "suzuki-haruna",
    name: "鈴木 陽菜",
    kana: "すずき はるな",
    age: 42,
    experience: "ヨガ約1年。デスクワーク後のケア目的",
    caution: "首まわりの緊張が強い。急なツイストは控えめ",
    memo: "安心できる声かけがあると集中しやすい。夜クラスの参加が多い",
    lastLessonDate: "2025/5/20",
    linkedLessonCount: 11,
    status: "caution",
  },
  {
    id: "tanaka-yuko",
    name: "田中 優子",
    kana: "たなか ゆうこ",
    age: 29,
    experience: "初心者。ストレッチ経験あり",
    caution: "腰に張りが出やすい。長い前屈の様子を見る",
    memo: "小さな達成感を言葉で返すと継続意欲が高まりやすい",
    lastLessonDate: "2025/5/12",
    linkedLessonCount: 7,
    status: "follow",
  },
  {
    id: "yamamoto-kana",
    name: "山本 香織",
    kana: "やまもと かおり",
    age: 51,
    experience: "陰ヨガ中心に約2年",
    caution: "肩の可動域に左右差あり",
    memo: "静かな誘導と長めのホールドを好む。疲労回復目的で参加",
    lastLessonDate: "2025/5/16",
    linkedLessonCount: 24,
    status: "recent",
  },
  {
    id: "takahashi-rina",
    name: "高橋 里奈",
    kana: "たかはし りな",
    age: 38,
    experience: "ランニング経験あり。ヨガは約6か月",
    caution: "股関節まわりに詰まり感あり",
    memo: "体幹強化への関心が高い。テンポのあるフローも楽しめる",
    lastLessonDate: "2025/5/03",
    linkedLessonCount: 5,
    status: "follow",
  },
];

export const lessonTemplates: LessonTemplate[] = [
  {
    id: "basic-flow",
    name: "ベーシックフロー",
    theme: "体幹強化・柔軟性向上・呼吸の安定",
    tags: ["#ベーシックフロー", "#肩こり改善", "#呼吸", "#体幹強化"],
    structure:
      "センタリング、肩甲骨ウォームアップ、太陽礼拝、立位、バランス、ツイスト、クールダウン、シャバーサナ",
    cautions: "膝や腰に違和感がある生徒には後屈と深い前屈を控えめにする",
  },
  {
    id: "shoulder-care",
    name: "肩こり改善ヨガ",
    theme: "肩首の緊張緩和・胸を開く意識づけ",
    tags: ["#肩こり改善", "#姿勢改善", "#呼吸", "#柔軟性向上"],
    structure: "首肩ほぐし、胸を開くポーズ、肩甲骨ワーク、やさしいツイスト、長めの呼吸観察",
    cautions: "首を大きく回しすぎず、しびれが出る動きはすぐに止める",
  },
  {
    id: "relax-yoga",
    name: "リラックスヨガ",
    theme: "睡眠の質向上・自律神経の調整",
    tags: ["#リラックス", "#陰ヨガ", "#睡眠", "#リストラティブ"],
    structure: "呼吸観察、ゆったりフロー、陰ヨガ、プロップスを使った休息、長めのシャバーサナ",
    cautions: "冷えやすい生徒にはブランケット使用を促し、静かな声かけを中心にする",
  },
  {
    id: "yin-yoga",
    name: "陰ヨガ",
    theme: "股関節・背骨まわりの解放と深い休息",
    tags: ["#陰ヨガ", "#柔軟性向上", "#骨盤調整", "#リラックス"],
    structure: "呼吸観察、股関節をゆるめるポーズ、前屈、ツイスト、静かな休息",
    cautions: "ホールド時間を長くしすぎず、痛みと伸び感の違いを丁寧に伝える",
  },
];

export const lessons: LessonRecord[] = [
  {
    id: "basic-flow-20250520",
    title: "ベーシックフロー",
    date: "2025/5/20（火）",
    startTime: "10:00",
    endTime: "11:00",
    duration: "60分",
    place: "スタジオA",
    format: "グループ",
    theme: "体幹強化・柔軟性向上・呼吸の安定",
    tags: ["#ベーシックフロー", "#肩こり改善", "#呼吸", "#体幹強化"],
    participants: 9,
    templateId: "basic-flow",
    templateName: "ベーシックフロー",
    status: "記録済み",
    prePlan:
      "センタリング・呼吸法、肩甲骨まわりのウォームアップ、太陽礼拝A、立位ポーズ、バランスポーズ、ツイスト、クールダウン、シャバーサナ。",
    preFocus:
      "呼吸と動きの連動を丁寧に確認する。後半のバランスポーズでは休息を挟み、焦らず安定感を作る。",
    studentCare:
      "佐藤さんは膝の違和感に配慮し深い後屈を避ける。鈴木さんは首まわりを急に動かさない。",
    actualContent:
      "事前プラン通り実施。太陽礼拝Aを2周、戦士II・三角のポーズ・椅子のポーズ、木のポーズ、戦士IIIまで行った。",
    reaction:
      "集中力が高く、呼吸を意識しながら丁寧に動けていた。後半は疲労が見えたが表情は安定。",
    individualMemos:
      "佐藤さん：戦士IIIで軸が安定。鈴木さん：前屈の柔軟性が向上。田中さん：休息を入れると集中が戻る。",
    improvement: "次回はバランスポーズの時間配分を短くし、シャバーサナを5分に延長する。",
  },
  {
    id: "relax-yoga-20250519",
    title: "リラックスヨガ",
    date: "2025/5/19（月）",
    startTime: "13:30",
    endTime: "14:30",
    duration: "60分",
    place: "スタジオB",
    format: "グループ",
    theme: "肩首の緊張緩和・睡眠の質向上",
    tags: ["#リラックス", "#陰ヨガ", "#睡眠"],
    participants: 6,
    templateId: "relax-yoga",
    templateName: "リラックスヨガ",
    status: "記録済み",
    prePlan: "呼吸観察、ゆったりフロー、陰ヨガ、長めのシャバーサナで構成。",
    preFocus: "声のトーンを穏やかにし、安心してゆるめられる間をつくる。",
    studentCare: "冷えやすい生徒にはブランケットを案内。首こりが強い人には仰向けで調整。",
    actualContent: "肩首の緊張をゆるめ、陰ヨガと長めのシャバーサナで回復を促した。",
    reaction: "終盤は呼吸が深まり、安心感のある表情が増えた。",
    individualMemos: "山本さん：長めのホールドで表情が穏やかに。高橋さん：股関節まわりに詰まり感あり。",
    improvement: "導入の呼吸観察をもう少し長くする。",
  },
  {
    id: "posture-online-20250518",
    title: "姿勢改善ヨガ",
    date: "2025/5/18（日）",
    startTime: "18:30",
    endTime: "19:30",
    duration: "60分",
    place: "オンライン",
    format: "オンライン",
    theme: "背中と体幹の安定・姿勢改善",
    tags: ["#姿勢改善", "#オンライン", "#体幹"],
    participants: 4,
    templateId: "shoulder-care",
    templateName: "肩こり改善ヨガ",
    status: "記録済み",
    prePlan: "画面越しでも確認しやすい姿勢改善ワークを中心に構成。",
    preFocus: "説明を短く区切り、目線・肩・骨盤の位置を確認する。",
    studentCare: "腰に張りがある生徒には前屈を浅く。首まわりはゆっくり動かす。",
    actualContent: "背中と体幹の安定をテーマに、オンラインで姿勢確認を実施。",
    reaction: "画面越しでも胸の開きと目線の安定が確認できた。",
    individualMemos: "田中さん：腰の張りが出やすく前屈は浅め。高橋さん：体幹ワークへの反応がよい。",
    improvement: "オンライン用に説明を短く区切る。",
  },
  {
    id: "restorative-20250511",
    title: "リストラティブヨガ",
    date: "2025/5/11（日）",
    startTime: "10:30",
    endTime: "11:30",
    duration: "60分",
    place: "スタジオA",
    format: "グループ",
    theme: "深い休息・自律神経の調整",
    tags: ["#リストラティブ", "#呼吸", "#回復"],
    participants: 7,
    templateId: "relax-yoga",
    templateName: "リラックスヨガ",
    status: "記録待ち",
    prePlan: "プロップスを使い、胸を開く休息ポーズと仰向けの呼吸観察を中心にする。",
    preFocus: "説明を少なくし、静かな体験をつくる。寒さへの配慮を先に伝える。",
    studentCare: "山本さんは長めのホールドが合う。鈴木さんは首の角度に注意。",
    actualContent: "",
    reaction: "",
    individualMemos: "",
    improvement: "",
  },
];

export const lessonSchedules: LessonSchedule[] = [
  {
    id: "schedule-20250520-am",
    date: "2025/5/20（火）",
    time: "10:00-11:00",
    lessonName: "ベーシックフロー",
    templateId: "basic-flow",
    place: "スタジオA",
    format: "グループ",
    participantCount: 9,
    status: "記録済み",
    nextAction: "実施後記録まで完了。詳細を確認できます。",
    lessonId: "basic-flow-20250520",
  },
  {
    id: "schedule-20250520-pm",
    date: "2025/5/20（火）",
    time: "13:30-14:30",
    lessonName: "肩こり改善ヨガ",
    templateId: "shoulder-care",
    place: "スタジオB",
    format: "グループ",
    participantCount: 6,
    status: "記録待ち",
    nextAction: "レッスン後の実施内容と反応を追記します。",
    lessonId: "restorative-20250511",
  },
  {
    id: "schedule-20250521-am",
    date: "2025/5/21（水）",
    time: "10:00-11:00",
    lessonName: "リラックスヨガ",
    templateId: "relax-yoga",
    place: "オンライン",
    format: "オンライン",
    participantCount: 4,
    status: "事前準備済み",
    nextAction: "レッスン前に事前プランを確認します。",
    lessonId: "relax-yoga-20250519",
  },
  {
    id: "schedule-20250523-night",
    date: "2025/5/23（金）",
    time: "18:30-19:30",
    lessonName: "陰ヨガ",
    templateId: "yin-yoga",
    place: "スタジオA",
    format: "グループ",
    participantCount: 8,
    status: "予定",
    nextAction: "テンプレートからレッスンカルテを準備します。",
  },
  {
    id: "schedule-20250524-am",
    date: "2025/5/24（土）",
    time: "10:00-11:00",
    lessonName: "ベーシックフロー",
    templateId: "basic-flow",
    place: "スタジオA",
    format: "グループ",
    participantCount: 5,
    status: "事前準備中",
    nextAction: "事前プランを仕上げ、AIメンターに相談します。",
    lessonId: "basic-flow-20250520",
  },
];

export const lessonRecordSummaries: LessonRecordSummary[] = lessons
  .filter((lesson) => lesson.status === "記録済み" || lesson.status === "記録待ち")
  .map((lesson) => ({
    id: lesson.id,
    date: lesson.date,
    lessonName: lesson.title,
    participantCount: lesson.participants,
    tags: lesson.tags,
    status: lesson.status,
    summary: lesson.actualContent || "事前プランは作成済み。実施後記録はこれから追記します。",
    reaction: lesson.reaction || "レッスン後に生徒の反応を記録します。",
    improvement: lesson.improvement || "次回への改善ポイントを追記します。",
  }));

export const lessonFlow = [
  ["5分", "センタリング・呼吸法", "座位で呼吸を観察し、胸を開く意識づけ。"],
  ["8分", "肩甲骨ウォームアップ", "肩・首・背中まわりをほどき、胸中の緊張をゆるめる。"],
  ["10分", "太陽礼拝A（2周）", "呼吸と動きの連動を確認しながら、全身を温める。"],
  ["12分", "立位ポーズ", "戦士II、三角のポーズ、椅子のポーズで土台と姿勢を調整。"],
  ["8分", "バランスポーズ", "木のポーズ、戦士III。体幹の安定と目線の置き方を確認。"],
  ["7分", "ツイスト・前屈・開脚系", "背骨を開き保ち、無理なく股関節まわりをゆるめる。"],
  ["5分", "クールダウン", "仰向けで腰まわりを解放し、呼吸を落ち着かせる。"],
  ["5分", "シャバーサナ・呼吸の観察", "体感を味わい、レッスン後の心身の変化を確認。"],
] as const;

export const observationMemos = [
  ["2025/5/18", "肩まわりの緊張が緩み、呼吸が深まった。ダウンドッグの安定感UP。"],
  ["2025/5/11", "長時間デスクワーク後のレッスン。胸を開くポーズで呼吸が深まる。"],
  ["2025/5/04", "姿勢改善を意識して取り組めていた。プランクで体幹の安定感が向上。"],
  ["2025/4/27", "久しぶりの受講。体が硬くなっていたが、終盤はリラックスして動けていた。"],
] as const;

export function getStudent(id: string) {
  return students.find((student) => student.id === id) ?? students[0];
}

export function getLesson(id: string) {
  return lessons.find((lesson) => lesson.id === id) ?? lessons[0];
}

export function getLessonTemplate(id: string) {
  return lessonTemplates.find((template) => template.id === id) ?? lessonTemplates[0];
}
