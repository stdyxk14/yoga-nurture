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

export type LessonRecord = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  place: string;
  format: "パーソナル" | "グループ" | "オンライン";
  theme: string;
  tags: string[];
  participants: number;
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
    name: "鈴木 晴菜",
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
    caution: "腰に張りが出やすい。長い前屈は様子を見る",
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
    experience: "陰ヨガ中心に約5年",
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
  },
];

export const lessonFlow = [
  ["5分", "センタリング・呼吸法", "座位で呼吸を観察し、吐く息を長くする意識づけ。"],
  ["8分", "肩甲骨まわりのウォームアップ", "肩・首・胸まわりをほどき、背中の緊張をゆるめる。"],
  ["10分", "太陽礼拝A（2周）", "呼吸と動きの連動を確認しながら、全身を温める。"],
  ["12分", "立位ポーズ", "戦士II、三角のポーズ、椅子のポーズで土台と姿勢を調整。"],
  ["8分", "バランスポーズ", "木のポーズ、戦士III。体幹の安定と目線の置き方を確認。"],
  ["7分", "ツイスト・前屈・開脚系", "背骨を長く保ち、無理なく股関節まわりをゆるめる。"],
  ["5分", "クールダウン", "仰向けで腰まわりを解放し、呼吸を落ち着かせる。"],
  ["5分", "シャバーサナ・呼吸の観察", "余韻を味わい、レッスン後の心身の変化を確認。"],
] as const;

export const observationMemos = [
  ["2025/5/18", "肩まわりの緊張が緩み、呼吸が深まり、表情も柔らかく。ダウンドッグの安定感UP。"],
  ["2025/5/11", "長時間デスクワーク後のレッスン。肩・首のこり強め。胸を開くポーズで呼吸が深まる。"],
  ["2025/5/04", "姿勢改善を意識して取り組めていた。プランクで体幹の安定感が向上。"],
  ["2025/4/27", "久しぶりの受講。体が硬くなっていたが、終盤はリラックスして動けていた。"],
] as const;

export function getStudent(id: string) {
  return students.find((student) => student.id === id) ?? students[0];
}

export function getLesson(id: string) {
  return lessons.find((lesson) => lesson.id === id) ?? lessons[0];
}
