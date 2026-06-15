export type Gender = "女性" | "男性" | "その他" | "回答しない";
export type GenderCode = "female" | "male" | "other" | "prefer_not_to_say";
export type AttendanceStatus = "参加" | "キャンセル" | "無断欠席";
export type LessonStatus = "予定" | "事前準備中" | "事前準備済み" | "記録待ち" | "記録済み";
export type LessonFormat = "パーソナル" | "グループ" | "オンライン";
export type BlockReaction = string;

export type StudentRecord = {
  id: string;
  name: string;
  kana: string;
  ageGroup: string;
  gender: Gender;
  genderCode?: GenderCode;
  experience: string;
  caution: string;
  memo: string;
  lastLessonDate: string;
  linkedLessonCount: number;
  cancelCount?: number;
  nextLessonDate?: string;
  status: "recent" | "follow" | "caution";
};

export type BlockTemplate = {
  id: string;
  name: string;
  majorCategory: string;
  minorCategory: string;
  duration: string;
  purpose: string;
  level: string;
  cautions: string;
  script: string;
  tags: string[];
  memo: string;
  usageCount: number;
  averageRating: number;
  goodRate?: number | null;
  improvementCount?: number;
  skipCount?: number;
  lastUsed: string;
  lastUsedAt?: string;
};

export type LessonTemplate = {
  id: string;
  name: string;
  theme: string;
  tags: string[];
  structure: string;
  cautions: string;
};

export type LessonParticipant = {
  studentId: string;
  status: AttendanceStatus;
  condition: string;
  memo: string;
  nextFollow: string;
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
  status: LessonStatus;
  templateName: string;
  blockIds: string[];
  plannedStudentIds: string[];
  participants: LessonParticipant[];
  preFocus: string;
  studentCare: string;
  actualContent: string;
  reaction: string;
  improvement: string;
};

export type LessonSchedule = {
  id: string;
  date: string;
  time: string;
  lessonName: string;
  planId?: string;
  place: string;
  format: LessonFormat;
  participantCount: number;
  status: LessonStatus;
  nextAction: string;
  lessonId?: string;
};

export type BlockResult = {
  blockId: string;
  done: boolean;
  actualDuration: string;
  reaction: BlockReaction;
  teacherMemo: string;
  improvementMemo: string;
  useAgain: boolean;
  scriptRevision: string;
};

export type BlockUsageHistory = BlockResult & {
  lessonId: string;
  lessonDate: string;
  planName: string;
  lessonName: string;
  scriptReviewRequired: boolean;
};

export type StudentObservation = {
  date: string;
  lessonTitle: string;
  lessonId?: string;
  attendanceStatus: AttendanceStatus;
  condition: string;
  memo?: string;
  nextFollow: string;
};

export type StudentLessonHistory = {
  lessonId: string;
  date: string;
  lessonTitle: string;
  planName: string;
  attendanceStatus: AttendanceStatus;
  teacherMemo: string;
  observation: string;
  memo: string;
  nextFollow: string;
};

export type StudentAttendanceStats = {
  attendedCount: number;
  cancelCount: number;
  noShowCount: number;
  cancelRate: number;
  lastAttendedDate: string;
  nextScheduledDate: string;
};

export const students: StudentRecord[] = [
  {
    id: "sato-misaki",
    name: "佐藤 美咲",
    kana: "さとう みさき",
    ageGroup: "30半ば",
    gender: "女性",
    experience: "ヨガ約3年、ピラティス経験あり",
    caution: "膝に違和感あり。深い後屈は避ける",
    memo: "呼吸を重視したゆったりフローが好み。変化を実感すると継続しやすい",
    lastLessonDate: "2025/5/20",
    linkedLessonCount: 18,
    status: "recent",
  },
  {
    id: "suzuki-haruna",
    name: "鈴木 陽菜",
    kana: "すずき はるな",
    ageGroup: "40前半",
    gender: "女性",
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
    ageGroup: "20後半",
    gender: "女性",
    experience: "初心者。ストレッチ経験あり",
    caution: "腰に張りが出やすい。長い前屈の様子を見る",
    memo: "小さな達成感を言葉で返すと継続意欲が高まりやすい",
    lastLessonDate: "2025/5/18",
    linkedLessonCount: 7,
    status: "follow",
  },
  {
    id: "yamamoto-kana",
    name: "山本 香織",
    kana: "やまもと かおり",
    ageGroup: "50前半",
    gender: "女性",
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
    ageGroup: "30後半",
    gender: "女性",
    experience: "ランニング経験あり。ヨガは約6か月",
    caution: "股関節まわりに詰まり感あり",
    memo: "体幹強化への関心が高い。テンポのあるフローも楽しめる",
    lastLessonDate: "2025/5/03",
    linkedLessonCount: 5,
    status: "follow",
  },
  {
    id: "ito-makoto",
    name: "伊藤 真",
    kana: "いとう まこと",
    ageGroup: "40半ば",
    gender: "男性",
    experience: "ジム経験あり。ヨガは初心者",
    caution: "肩関節が硬く、無理な挙上は避ける",
    memo: "説明が具体的だと安心して動ける",
    lastLessonDate: "2025/5/18",
    linkedLessonCount: 3,
    status: "caution",
  },
];

export const blockTemplates: BlockTemplate[] = [
  {
    id: "intro-grounding",
    name: "基礎クラス導入",
    majorCategory: "導入",
    minorCategory: "テーマ説明",
    duration: "5分",
    purpose: "安全に動くための心構えと今日のテーマを共有する",
    level: "全レベル",
    cautions: "痛みが出る動きは避け、途中でも休んでよいことを伝える",
    script:
      "本日は貴重なお時間をいただきありがとうございます。このクラスでは、基礎的なヨガのポーズの手足の土台の作り方や、安全にヨガを深めていくポイントをお伝えします。無理をせず、どこまで伸ばすと心地よいのか、体の声を聞く60分にしていきましょう。",
    tags: ["#導入", "#初心者向け", "#安全"],
    memo: "最初に空調と怪我の有無を確認すると安心感が出る",
    usageCount: 18,
    averageRating: 4.7,
    lastUsed: "2025/5/20",
  },
  {
    id: "toe-exercise",
    name: "足指体操",
    majorCategory: "導入",
    minorCategory: "足指体操",
    duration: "5分",
    purpose: "足裏の筋肉を目覚めさせ、片足立ちの土台を作る",
    level: "初心者向け",
    cautions: "足裏や足指に痛みがある場合は小さく動かす",
    script:
      "足指でグー、パー、チョキ、逆チョキを作りましょう。足裏の筋肉を鍛えると、とっさに踏ん張る力が出て、転倒予防にもつながります。土踏まずのアーチを感じながら、足の裏で床を吸い上げるようなイメージで動かします。",
    tags: ["#足裏", "#バランス", "#初心者向け"],
    memo: "バランス月間の導入に使いやすい",
    usageCount: 12,
    averageRating: 4.5,
    lastUsed: "2025/5/20",
  },
  {
    id: "complete-breath",
    name: "完全呼吸法",
    majorCategory: "呼吸法",
    minorCategory: "完全呼吸法",
    duration: "8分",
    purpose: "お腹・胸・鎖骨の呼吸をつなげて呼吸を深める",
    level: "全レベル",
    cautions: "息苦しさがある人は自然呼吸に戻す",
    script:
      "完全呼吸法から行いましょう。お腹、胸、鎖骨のあたりの呼吸筋を使って呼吸を深めます。仰向けになり、鼻から深く吸って、鼻から深く吐いてリラックスしましょう。吸う息で下からお腹を膨らませ、胸を開き、鎖骨を引き上げます。吐く息も下から、お腹をへこませ、胸を閉じ、鎖骨を下げます。ご自身の呼吸のペースで深めていきましょう。",
    tags: ["#呼吸", "#リラックス", "#基礎"],
    memo: "説明が長くなりやすいので、最初は短く区切る",
    usageCount: 21,
    averageRating: 4.8,
    lastUsed: "2025/5/20",
  },
  {
    id: "cat-cow",
    name: "キャットカウ",
    majorCategory: "ウォーミングアップ",
    minorCategory: "キャットカウ",
    duration: "6分",
    purpose: "背骨を動かし、呼吸と動きを連動させる",
    level: "全レベル",
    cautions: "手首がつらい場合は拳やブロックを使う",
    script:
      "四つん這いになりましょう。手は肩幅、手首を肩の真下、膝を腰の真下に置きます。吸いながらお腹を下げて胸を広げ、顎を反らせます。吐く息でお腹を引き上げ、肩甲骨の間を天井に押し上げ、目線をお腹に向けましょう。ご自身のペースで繰り返します。",
    tags: ["#ウォーミングアップ", "#背骨", "#呼吸"],
    memo: "オンラインでも見せやすい",
    usageCount: 17,
    averageRating: 4.6,
    lastUsed: "2025/5/18",
  },
  {
    id: "sun-salutation-a",
    name: "スーリャナマスカーラA",
    majorCategory: "スーリャナマスカーラ",
    minorCategory: "太陽礼拝A",
    duration: "10分",
    purpose: "全身を温め、呼吸と動きの流れを作る",
    level: "中級者向け",
    cautions: "手首・肩・腰に違和感がある人は軽減法を案内する",
    script:
      "胸の前で合掌し、一度息を吐き切ります。吸いながら両手を天井へ、吐きながら腿の付け根から前屈。吸いながら両足を後方に引いてプランク、吐きながら膝・胸・顎を下ろし、吸ってコブラ、吐いてダウンドッグ。呼吸を深め、次の吐く息で目線前方、両手の間に足を戻します。",
    tags: ["#フロー", "#体幹強化", "#太陽礼拝"],
    memo: "初心者クラスでは回数を2回に調整",
    usageCount: 9,
    averageRating: 4.3,
    lastUsed: "2025/5/20",
  },
  {
    id: "tree-pose",
    name: "ブルクシャアーサナ",
    majorCategory: "ターゲットアーサナ",
    minorCategory: "木のポーズ",
    duration: "7分",
    purpose: "片足立ちの安定と集中力を高める",
    level: "全レベル",
    cautions: "足裏を膝に当てない。壁の近くで行ってもよい",
    script:
      "右膝を胸に引き寄せ、左足裏で床を押します。右足裏を左腿の内側、またはふくらはぎに添えましょう。安定していれば吸う息で両手を上に上げます。肩を下げ、首を長く保ち、視線を一点に集中します。呼吸をゆったり続けましょう。",
    tags: ["#バランス", "#集中", "#体幹強化"],
    memo: "足指体操と組み合わせると反応が良い",
    usageCount: 11,
    averageRating: 4.7,
    lastUsed: "2025/5/20",
  },
  {
    id: "neck-stretch",
    name: "首のストレッチ",
    majorCategory: "クールダウン",
    minorCategory: "首のストレッチ",
    duration: "4分",
    purpose: "首まわりをゆるめ、緊張をほどく",
    level: "全レベル",
    cautions: "首に違和感がある人は押さずに小さく行う",
    script:
      "両手を頭の後ろで組み、後頭部を包みます。吸いながら手と頭で軽く押し合い、吐いて脱力して軽く顎を引きましょう。もう一度、吸って押し合い、吐いて脱力。首の後ろをゆるめます。",
    tags: ["#肩こり改善", "#クールダウン", "#首"],
    memo: "肩こり改善ヨガでよく使う",
    usageCount: 15,
    averageRating: 4.6,
    lastUsed: "2025/5/20",
  },
  {
    id: "halasana",
    name: "ハラアーサナ",
    majorCategory: "クールダウン",
    minorCategory: "ハラアーサナ",
    duration: "5分",
    purpose: "背面を伸ばし、内側への集中を促す",
    level: "中級者向け",
    cautions: "腰や首に違和感がある人、逆転を避けたい人は足を天井に上げたまま",
    script:
      "仰向けで足を天井に引き上げます。これ以上の逆転を避けたい方、腰や首に違和感がある方はこのままキープしましょう。可能な方は反動をつけず、足先を頭の先へ伸ばします。首は絶対に動かさないでください。",
    tags: ["#クールダウン", "#逆転", "#背面"],
    memo: "注意喚起を先に入れる",
    usageCount: 5,
    averageRating: 4.1,
    lastUsed: "2025/4/12",
  },
  {
    id: "savasana",
    name: "シャヴァーサナ",
    majorCategory: "クールダウン",
    minorCategory: "シャヴァーサナ",
    duration: "6分",
    purpose: "レッスンの余韻を感じ、心身を休める",
    level: "全レベル",
    cautions: "腰がつらい方は膝を立てる",
    script:
      "仰向けで全身を軽くゆすって力を抜きましょう。両手を軽く広げ、脇の下にこぶし一つ分のスペースを作ります。足は腰幅に開きます。ご自身の呼吸に意識を戻し、体の重さを床へ預けましょう。",
    tags: ["#リラックス", "#クールダウン", "#回復"],
    memo: "長めに取ると満足度が高い",
    usageCount: 24,
    averageRating: 4.9,
    lastUsed: "2025/5/20",
  },
  {
    id: "closing",
    name: "クロージング",
    majorCategory: "クロージング",
    minorCategory: "締めの挨拶",
    duration: "3分",
    purpose: "レッスンの体験を言葉にして終える",
    level: "全レベル",
    cautions: "余韻を急がせない",
    script:
      "お疲れ様でした。60分間、体と心に向き合えたでしょうか。基礎のクラスでは基本的なポーズを中心に、初心に戻ることも、深めることもできます。また体と心のバランスを整えたい時に受けてみてください。",
    tags: ["#クロージング", "#余韻", "#声かけ"],
    memo: "感想を聞く前に余白を作る",
    usageCount: 16,
    averageRating: 4.5,
    lastUsed: "2025/5/20",
  },
];

export const lessonTemplates: LessonTemplate[] = [
  {
    id: "block-balance-flow",
    name: "基礎バランスフロー",
    theme: "片足立ちの安定と呼吸の深まり",
    tags: ["#バランス", "#呼吸", "#初心者向け"],
    structure: "導入、足指体操、完全呼吸法、キャットカウ、太陽礼拝A、木のポーズ、クールダウン",
    cautions: "膝・首・腰に不安がある生徒へ軽減法を案内する",
  },
  {
    id: "block-relax-flow",
    name: "リラックスヨガ",
    theme: "肩首の緊張緩和と休息",
    tags: ["#リラックス", "#肩こり改善", "#クールダウン"],
    structure: "導入、完全呼吸法、キャットカウ、首のストレッチ、シャヴァーサナ、クロージング",
    cautions: "冷えやすい生徒にブランケットを案内する",
  },
];

const planBlockIds = [
  "intro-grounding",
  "toe-exercise",
  "complete-breath",
  "cat-cow",
  "sun-salutation-a",
  "tree-pose",
  "neck-stretch",
  "halasana",
  "savasana",
  "closing",
];

export const lessons: LessonRecord[] = [
  {
    id: "basic-flow-20250520",
    title: "基礎バランスフロー",
    date: "2025/5/20（火）",
    startTime: "10:00",
    endTime: "11:00",
    duration: "60分",
    place: "スタジオA",
    format: "グループ",
    theme: "片足立ちの安定と呼吸の深まり",
    tags: ["#バランス", "#呼吸", "#初心者向け", "#体幹強化"],
    status: "記録済み",
    templateName: "ブロック組み合わせプラン",
    blockIds: planBlockIds,
    plannedStudentIds: ["sato-misaki", "suzuki-haruna", "tanaka-yuko", "yamamoto-kana", "takahashi-rina", "ito-makoto"],
    participants: [
      {
        studentId: "sato-misaki",
        status: "参加",
        condition: "集中して取り組めていた",
        memo: "木のポーズで軸が安定",
        nextFollow: "膝の違和感がないか冒頭で確認",
      },
      {
        studentId: "suzuki-haruna",
        status: "参加",
        condition: "呼吸が深くなり表情が穏やか",
        memo: "完全呼吸法への反応が良い",
        nextFollow: "首まわりの可動域を軽く確認",
      },
      {
        studentId: "tanaka-yuko",
        status: "参加",
        condition: "小さな成功体験で笑顔が増えた",
        memo: "休息を入れると集中が戻る",
        nextFollow: "前屈は浅めから始める",
      },
      {
        studentId: "yamamoto-kana",
        status: "キャンセル",
        condition: "",
        memo: "前日に連絡あり",
        nextFollow: "次回の体調を確認",
      },
      {
        studentId: "ito-makoto",
        status: "無断欠席",
        condition: "",
        memo: "連絡なし",
        nextFollow: "次回予約前に参加意思を確認",
      },
    ],
    preFocus: "足裏の土台からバランスポーズへつなげる。首肩に不安がある人には軽減法を先に伝える。",
    studentCare: "佐藤さんは膝、鈴木さんは首、田中さんは腰に注意。伊藤さんは肩の挙上を無理しない。",
    actualContent: "足指体操、完全呼吸法、キャットカウ、太陽礼拝A、木のポーズ、首のストレッチ、シャヴァーサナまで実施。",
    reaction: "足指体操と完全呼吸法の反応が良く、後半のバランスは集中度が高かった。",
    improvement: "ハラアーサナは説明を短くし、首の注意を先に伝える。シャヴァーサナを1分長くしたい。",
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
    theme: "肩首の緊張緩和と休息",
    tags: ["#リラックス", "#肩こり改善", "#クールダウン"],
    status: "事前準備済み",
    templateName: "リラックス系ブロックプラン",
    blockIds: ["intro-grounding", "complete-breath", "cat-cow", "neck-stretch", "savasana", "closing"],
    plannedStudentIds: ["sato-misaki", "yamamoto-kana", "takahashi-rina"],
    participants: [],
    preFocus: "声のトーンを穏やかにし、休息の選択肢を多めに用意する。",
    studentCare: "冷えやすい生徒にはブランケットを案内。",
    actualContent: "",
    reaction: "",
    improvement: "",
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
    theme: "深い休息と呼吸観察",
    tags: ["#リストラティブ", "#呼吸", "#回復"],
    status: "記録待ち",
    templateName: "休息ブロックプラン",
    blockIds: ["intro-grounding", "complete-breath", "neck-stretch", "savasana", "closing"],
    plannedStudentIds: ["sato-misaki", "suzuki-haruna", "yamamoto-kana"],
    participants: [],
    preFocus: "説明を少なくし、静かな体験をつくる。",
    studentCare: "首の角度と冷えに配慮。",
    actualContent: "",
    reaction: "",
    improvement: "",
  },
];

export const lessonSchedules: LessonSchedule[] = [
  {
    id: "schedule-20250520-am",
    date: "2025/5/20（火）",
    time: "10:00-11:00",
    lessonName: "基礎バランスフロー",
    planId: "basic-flow-20250520",
    place: "スタジオA",
    format: "グループ",
    participantCount: 6,
    status: "記録済み",
    nextAction: "ブロック別記録まで完了。原稿と反応を確認できます。",
    lessonId: "basic-flow-20250520",
  },
  {
    id: "schedule-20250520-pm",
    date: "2025/5/20（火）",
    time: "13:30-14:30",
    lessonName: "肩こり改善ヨガ",
    planId: "relax-yoga-20250519",
    place: "スタジオB",
    format: "グループ",
    participantCount: 6,
    status: "記録待ち",
    nextAction: "レッスン後のブロック評価と生徒コメントを追記します。",
    lessonId: "restorative-20250511",
  },
  {
    id: "schedule-20250521-am",
    date: "2025/5/21（水）",
    time: "10:00-11:00",
    lessonName: "リラックスヨガ",
    planId: "relax-yoga-20250519",
    place: "オンライン",
    format: "オンライン",
    participantCount: 4,
    status: "事前準備済み",
    nextAction: "原稿を印刷してレッスン前に確認します。",
    lessonId: "relax-yoga-20250519",
  },
  {
    id: "schedule-20250523-night",
    date: "2025/5/23（金）",
    time: "18:30-19:30",
    lessonName: "陰ヨガ",
    place: "スタジオA",
    format: "グループ",
    participantCount: 8,
    status: "予定",
    nextAction: "ブロックを組み合わせてレッスンプランを作成します。",
  },
];

export const blockResults: Record<string, BlockResult[]> = {
  "basic-flow-20250520": [
    {
      blockId: "intro-grounding",
      done: true,
      actualDuration: "5分",
      reaction: "良かった",
      teacherMemo: "導入で安心感が出た",
      improvementMemo: "空調確認をもう少し早く入れる",
      useAgain: true,
      scriptRevision: "怪我の確認を一文追加",
    },
    {
      blockId: "toe-exercise",
      done: true,
      actualDuration: "6分",
      reaction: "良かった",
      teacherMemo: "片足立ちとのつながりが伝わった",
      improvementMemo: "タオルなしの説明を短くする",
      useAgain: true,
      scriptRevision: "足裏で床を吸い上げる比喩は残す",
    },
    {
      blockId: "complete-breath",
      done: true,
      actualDuration: "8分",
      reaction: "良かった",
      teacherMemo: "呼吸が深まった",
      improvementMemo: "鎖骨式の説明をゆっくり",
      useAgain: true,
      scriptRevision: "下から上へ、の言い方が良い",
    },
    {
      blockId: "cat-cow",
      done: true,
      actualDuration: "6分",
      reaction: "良かった",
      teacherMemo: "背骨と呼吸の連動が見えやすく、全体の集中が上がった。",
      improvementMemo: "手首が気になる人向けに拳やブロックの選択肢を先に伝える。",
      useAgain: true,
      scriptRevision: "四つ這いに入る前に軽減法を一文追加。",
    },
    {
      blockId: "sun-salutation-a",
      done: true,
      actualDuration: "10分",
      reaction: "普通",
      teacherMemo: "2周目で呼吸と動きが合ってきたが、説明が少し多かった。",
      improvementMemo: "1周目はゆっくり、2周目は声かけを減らす。",
      useAgain: true,
      scriptRevision: "吸う・吐くの合図を短くする。",
    },
    {
      blockId: "tree-pose",
      done: true,
      actualDuration: "7分",
      reaction: "良かった",
      teacherMemo: "足裏の導入からつながり、安定感が出ていた。",
      improvementMemo: "壁を使う選択肢を先に出すと不安が減りそう。",
      useAgain: true,
      scriptRevision: "視線と足裏の説明を残す。",
    },
    {
      blockId: "neck-stretch",
      done: true,
      actualDuration: "5分",
      reaction: "良かった",
      teacherMemo: "肩の力が抜け、後半のリラックスに入りやすくなった。",
      improvementMemo: "首を倒す角度は小さめで十分と先に伝える。",
      useAgain: true,
      scriptRevision: "痛みを探さない、余白を探す表現を追加。",
    },
    {
      blockId: "halasana",
      done: true,
      actualDuration: "4分",
      reaction: "普通",
      teacherMemo: "首の注意に時間を使った",
      improvementMemo: "初心者が多い時は代替を長めに",
      useAgain: false,
      scriptRevision: "逆転を避けたい方への案内を冒頭へ",
    },
    {
      blockId: "savasana",
      done: true,
      actualDuration: "7分",
      reaction: "良かった",
      teacherMemo: "全体の呼吸が落ち着き、余韻を感じる時間になった。",
      improvementMemo: "開始前に膝下ブランケットの選択肢を案内する。",
      useAgain: true,
      scriptRevision: "床に体を預ける表現を少し増やす。",
    },
    {
      blockId: "closing",
      done: true,
      actualDuration: "3分",
      reaction: "良かった",
      teacherMemo: "落ち着いた空気のまま締められた。",
      improvementMemo: "次回テーマへの一言を最後に添える。",
      useAgain: true,
      scriptRevision: "余韻を急がせない声かけを残す。",
    },
  ],
  "relax-yoga-20250519": [
    {
      blockId: "intro-grounding",
      done: true,
      actualDuration: "4分",
      reaction: "良かった",
      teacherMemo: "肩首の緊張を確認する導入が自然で、安心感が出た。",
      improvementMemo: "オンライン参加者にも聞こえるように最初の声量を少し上げる。",
      useAgain: true,
      scriptRevision: "今日のテーマを一文で伝えてから呼吸へ入る。",
    },
    {
      blockId: "complete-breath",
      done: true,
      actualDuration: "9分",
      reaction: "良かった",
      teacherMemo: "呼吸が深くなり、表情が穏やかになった。",
      improvementMemo: "鎖骨式の説明は短くし、体感の時間を長めに取る。",
      useAgain: true,
      scriptRevision: "吸う息を下から積み上げる表現を残す。",
    },
    {
      blockId: "cat-cow",
      done: true,
      actualDuration: "7分",
      reaction: "普通",
      teacherMemo: "肩まわりはほぐれたが、手首の負担を気にする生徒がいた。",
      improvementMemo: "拳や前腕を使う軽減法を最初に案内する。",
      useAgain: true,
      scriptRevision: "手首の軽減法を追加。",
    },
    {
      blockId: "neck-stretch",
      done: true,
      actualDuration: "6分",
      reaction: "良かった",
      teacherMemo: "首肩の力が抜け、後半の休息につながった。",
      improvementMemo: "押さずに重さを預ける表現を強調する。",
      useAgain: true,
      scriptRevision: "痛みを探さない声かけを追加。",
    },
    {
      blockId: "savasana",
      done: true,
      actualDuration: "8分",
      reaction: "良かった",
      teacherMemo: "静かな時間を長めに取れて満足度が高かった。",
      improvementMemo: "終了合図をさらに柔らかくする。",
      useAgain: true,
      scriptRevision: "戻る前の呼吸観察を追加。",
    },
  ],
  "restorative-20250511": [
    {
      blockId: "intro-grounding",
      done: true,
      actualDuration: "5分",
      reaction: "普通",
      teacherMemo: "静かな導入は合っていたが、説明が少し抽象的だった。",
      improvementMemo: "休息の目的を具体的に一文で伝える。",
      useAgain: true,
      scriptRevision: "体を休める選択肢を冒頭へ。",
    },
    {
      blockId: "complete-breath",
      done: true,
      actualDuration: "7分",
      reaction: "良かった",
      teacherMemo: "呼吸のペースが整い、休息へ入りやすくなった。",
      improvementMemo: "数を数える誘導は短めにする。",
      useAgain: true,
      scriptRevision: "自然呼吸へ戻す合図を追加。",
    },
    {
      blockId: "neck-stretch",
      done: false,
      actualDuration: "0分",
      reaction: "普通",
      teacherMemo: "時間調整のためスキップした。",
      improvementMemo: "次回は導入後すぐに短く入れる。",
      useAgain: false,
      scriptRevision: "短縮版の原稿を作る。",
    },
    {
      blockId: "savasana",
      done: true,
      actualDuration: "12分",
      reaction: "良かった",
      teacherMemo: "長めの休息で呼吸が落ち着き、終了後の表情が柔らかかった。",
      improvementMemo: "寒さ対策の声かけを最初に入れる。",
      useAgain: true,
      scriptRevision: "ブランケット案内を追加。",
    },
  ],
};

export const studentObservations: Record<string, StudentObservation[]> = {
  "sato-misaki": [
    {
      date: "2025/5/20",
      lessonTitle: "基礎バランスフロー",
      lessonId: "basic-flow-20250520",
      attendanceStatus: "参加",
      condition: "集中して取り組めていた",
      memo: "木のポーズで軸が安定していた",
      nextFollow: "膝の違和感がないか冒頭で確認",
    },
    {
      date: "2025/5/18",
      lessonTitle: "姿勢改善ヨガ",
      lessonId: "basic-flow-20250520",
      attendanceStatus: "参加",
      condition: "呼吸が深まり表情が柔らかい",
      memo: "無理のない範囲で継続できている",
      nextFollow: "後屈は浅めにして膝の反応を見る",
    },
    {
      date: "2025/5/11",
      lessonTitle: "リストラティブヨガ",
      lessonId: "restorative-20250511",
      attendanceStatus: "参加",
      condition: "静かな誘導に集中できていた",
      memo: "長めのシャヴァーサナへの反応が良い",
      nextFollow: "膝下サポートを用意する",
    },
    {
      date: "2025/5/04",
      lessonTitle: "陰ヨガ",
      lessonId: "relax-yoga-20250519",
      attendanceStatus: "参加",
      condition: "股関節まわりを慎重に動かしていた",
      memo: "ボルスターを使うと安定した",
      nextFollow: "深い前屈は無理に進めない",
    },
    {
      date: "2025/4/27",
      lessonTitle: "ベーシックフロー",
      lessonId: "basic-flow-20250520",
      attendanceStatus: "参加",
      condition: "久しぶりの受講でも落ち着いて参加",
      memo: "呼吸法から入ると動きやすい",
      nextFollow: "翌日の膝の状態を聞く",
    },
    {
      date: "2025/4/20",
      lessonTitle: "肩こり改善ヨガ",
      lessonId: "relax-yoga-20250519",
      attendanceStatus: "参加",
      condition: "首肩の力みを自覚できていた",
      memo: "軽減法を選べると安心して動ける",
      nextFollow: "首のストレッチは小さく始める",
    },
  ],
  "suzuki-haruna": [
    {
      date: "2025/5/20",
      lessonTitle: "基礎バランスフロー",
      lessonId: "basic-flow-20250520",
      attendanceStatus: "参加",
      condition: "安心した様子で動けていた",
      memo: "完全呼吸法への反応が良い",
      nextFollow: "首まわりの可動域を軽く確認",
    },
  ],
};

export const lessonRecordSummaries = lessons.map((lesson) => ({
  id: lesson.id,
  date: lesson.date,
  lessonName: lesson.title,
  participantCount: lesson.plannedStudentIds.length,
  tags: lesson.tags,
  status: lesson.status,
  summary: lesson.actualContent || "ブロックプランは作成済み。実施後記録はこれから追記します。",
  reaction: lesson.reaction || "レッスン後にブロック別の反応を記録します。",
  improvement: lesson.improvement || "改善メモを次回のプランに反映します。",
}));

export const blockAnalysis = [
  ["完全呼吸法", "21回", "4.8", "反応が良い"],
  ["シャヴァーサナ", "24回", "4.9", "満足度が高い"],
  ["ハラアーサナ", "5回", "4.1", "改善メモ多め"],
  ["スーリャナマスカーラA", "9回", "4.3", "最近少なめ"],
];

export function getStudent(id: string) {
  return students.find((student) => student.id === id) ?? students[0];
}

export function getLesson(id: string) {
  return lessons.find((lesson) => lesson.id === id) ?? lessons[0];
}

export function getBlock(id: string) {
  return blockTemplates.find((block) => block.id === id) ?? blockTemplates[0];
}

export function getLessonBlocks(lesson: LessonRecord) {
  return lesson.blockIds.map(getBlock);
}

export function getLessonTemplate(id: string) {
  return lessonTemplates.find((template) => template.id === id) ?? lessonTemplates[0];
}

export function getBlockUsageHistory(blockId: string): BlockUsageHistory[] {
  return lessons.flatMap((lesson) => {
    const result = blockResults[lesson.id]?.find((item) => item.blockId === blockId);
    if (!result) return [];

    return [
      {
        ...result,
        lessonId: lesson.id,
        lessonDate: lesson.date,
        planName: lesson.templateName,
        lessonName: lesson.title,
        scriptReviewRequired: !result.useAgain || Boolean(result.scriptRevision || result.improvementMemo),
      },
    ];
  });
}

export function getBlockAverageDuration(blockId: string) {
  const histories = getBlockUsageHistory(blockId);
  if (!histories.length) return getBlock(blockId).duration;
  const total = histories.reduce((sum, history) => sum + (Number.parseInt(history.actualDuration, 10) || 0), 0);
  return `${Math.round(total / histories.length)}分`;
}

export function getStudentLessonHistory(studentId: string): StudentLessonHistory[] {
  const linkedLessons = lessons.flatMap((lesson) => {
    const participant = lesson.participants.find((item) => item.studentId === studentId);
    const wasPlanned = lesson.plannedStudentIds.includes(studentId);
    if (!participant && !wasPlanned) return [];

    const status: AttendanceStatus = participant?.status ?? "参加";
    const observation = participant?.condition || (status === "参加" ? "事前参加予定。実施後コメントはこれから追記します。" : "参加予定から変更あり。");
    const teacherMemo =
      participant?.memo ||
      (status === "参加"
        ? lesson.reaction || "レッスン後の講師メモを追記予定です。"
        : "参加ステータスの確認が必要です。");

    return [
      {
        lessonId: lesson.id,
        date: lesson.date,
        lessonTitle: lesson.title,
        planName: lesson.templateName,
        attendanceStatus: status,
        teacherMemo,
        observation,
        memo: participant?.memo || "個別メモはレッスン後記録から蓄積されます。",
        nextFollow: participant?.nextFollow || "次回レッスン前に確認",
      },
    ];
  });

  const observationOnly = (studentObservations[studentId] ?? []).flatMap((memo) => {
    if (linkedLessons.some((lesson) => lesson.lessonId === memo.lessonId || (lesson.date.startsWith(memo.date) && lesson.lessonTitle === memo.lessonTitle))) return [];
    return [
      {
        lessonId: memo.lessonId ?? lessons[0].id,
        date: memo.date,
        lessonTitle: memo.lessonTitle,
        planName: "過去レッスンプラン",
        attendanceStatus: memo.attendanceStatus,
        teacherMemo: memo.memo ?? "過去の観察メモから移行",
        observation: memo.condition,
        memo: memo.memo ?? "観察メモとして蓄積",
        nextFollow: memo.nextFollow,
      },
    ];
  });

  return [...linkedLessons, ...observationOnly].sort((a, b) => b.date.localeCompare(a.date, "ja"));
}

export function getStudentObservationHistory(studentId: string) {
  return getStudentLessonHistory(studentId).map((history) => ({
    date: history.date.replace(/（.+）/, ""),
    lessonTitle: history.lessonTitle,
    lessonId: history.lessonId,
    attendanceStatus: history.attendanceStatus,
    condition: history.observation,
    memo: history.memo,
    nextFollow: history.nextFollow,
  }));
}

export function getStudentAttendanceStats(studentId: string): StudentAttendanceStats {
  const history = getStudentLessonHistory(studentId);
  const attendedCount = history.filter((item) => item.attendanceStatus === "参加").length;
  const cancelCount = history.filter((item) => item.attendanceStatus === "キャンセル").length;
  const noShowCount = history.filter((item) => item.attendanceStatus === "無断欠席").length;
  const totalScheduled = history.length || 1;
  const fallbackStudent = students.find((student) => student.id === studentId);
  const nextSchedule = lessonSchedules.find((schedule) => {
    const lesson = schedule.lessonId ? getLesson(schedule.lessonId) : undefined;
    return lesson?.plannedStudentIds.includes(studentId) && schedule.status !== "記録済み";
  });

  return {
    attendedCount,
    cancelCount,
    noShowCount,
    cancelRate: Math.round((cancelCount / totalScheduled) * 100),
    lastAttendedDate: history.find((item) => item.attendanceStatus === "参加")?.date ?? fallbackStudent?.lastLessonDate ?? "未記録",
    nextScheduledDate: nextSchedule ? `${nextSchedule.date} ${nextSchedule.time}` : "未定",
  };
}
