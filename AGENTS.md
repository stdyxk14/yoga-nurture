# Yoga Nurture repository instructions

このファイルはリポジトリ全体に適用する。明示された要求を最小範囲で実装し、この文書の保護事項を変更する必要がある場合は、その変更が明示的に許可されていることを確認する。

## Repository facts and sources of truth

- ルートの `package.json` と `package-lock.json` を基準に npm を使用する。未定義の script や、確認していないコマンドを推測して実行しない。
- 現在のアプリは Next.js 16 App Router、TypeScript、Tailwind CSS、Supabase を使用し、Vercel は Git 連携で公開する構成である。実装前に現行ファイルを再確認し、この記述より実コードと設定を優先する。
- DB のローカル資料は `supabase/schema.sql` と `supabase/migrations/` にある。`schema.sql` だけをREMOTEの現状とみなさず、DB変更時はmigration履歴と接続可能なREMOTEの実スキーマも確認する。
- 現在、`supabase/config.toml` とリポジトリ内のSupabase CLI依存はない。CLI操作が必要なときは、利用可能なCLI経路と対象projectへの接続を先に確認し、使用中のCLIの `--help` でcommandとflagを確認する。未確認の `npm` / `npx` / globalコマンドを固定しない。
- 2026-08-11の読み取り確認では、REMOTE `yoga-nurture` のmigration履歴は `20260810181640`、`20260810182105`、`20260810193653` の3件である。ローカルの `002_...`〜`005_...` はREMOTE履歴に登録されていない一方、対応するtable／columnはREMOTEに存在する。この既存の履歴差はDB作業のたびに再確認し、ファイルの存在だけで適用状態を判断したり、unrelatedな作業で推測修復したりしない。
- Vercelの現行設定は `vercel.json` の `hnd1` region、およびGitHub `main` からVercel project `yoga-nurture` へ自動deployする運用である。手動の `vercel deploy --prod` は使用しない。
- 現在 `package.json` にある検証scriptは `build`、`lint` とPlaywright E2E関連であり、`test` や純粋ロジック用のnpm scriptはない。検証コマンドは作業時点の `package.json` と既存テスト構成を再確認して選ぶ。

## Product priorities

- Yoga Nurtureは、ヨガ指導、レッスン、レッスンプラン、生徒情報を継続的に育てる個人利用のWebアプリである。
- 主な利用環境はPCとし、1024px、1280px、1440px程度の表示を優先する。
- スマートフォン表示は致命的に壊さない。ただし、要求にない過剰なスマートフォン最適化を行わない。
- レッスンカルテ、生徒カルテ、レポートを主要画面として扱う。
- 現場でレッスンプランから変更した内容は失敗ではなく「現場適応」である。表示、集計、AI向け文脈でも、調整、スキップ、置き換え、追加を失敗として扱わない。

## Protected behavior

- 原稿PDF／印刷出力のDOM、CSS、文字サイズ、余白、目次、改ページ、印刷デザインは、明示的な変更指示なしに変更しない。現在の関連実装には `src/app/lessons/[id]/script/`、`src/app/schedules/[id]/script/`、`src/components/yoga/lesson-plan-print-*.tsx`、`src/components/yoga/lesson-plan-script.tsx`、`src/components/yoga/rich-script-text.tsx`、`src/components/yoga/script-print-actions.tsx`、`src/app/globals.css` の印刷規則が含まれる。変更前に実際の描画経路を追い、この一覧だけで保護範囲を限定しない。
- 既存URLとroute pathを変更しない。rename、redirect、リンク先の置換も明示指示がある場合だけ行う。
- 既存RLSを弱めない。owner条件、関連テーブル経由の所有権確認、Storage policyを迂回しない。
- `service_role` key、`OPENAI_API_KEY`、認証情報、その他の秘密情報をclient bundle、`NEXT_PUBLIC_*`、ログ、fixture、commitへ公開しない。Supabaseのpublishable keyと秘密鍵を混同しない。
- 既存データを推測で補完、分類、書き換えしない。legacy／未確認／未評価の状態をそのまま保持する。
- `change_type = null` を「予定どおり」と推測しない。未分類またはlegacyとして扱う。
- `reaction = null` を評価母数へ含めない。未評価を否定的評価やゼロ点へ変換しない。
- `done = null` を実施またはスキップへ分類しない。未確認として扱う。
- 完了済みまたは見送り済みのフォローを、通常のレッスン記録編集で `pending` へ戻さない。フォロー状態を明示的に変更する操作だけが状態を変えてよい。
- 同一ブロックテンプレートが1つのレッスンプランまたは実施記録に複数回現れる場合、重複排除しない。`block_template_id` だけで同一視せず、`schedule_plan_item_id`、record item id、sort orderなどの出現単位を保持する。

## Implementation workflow

- 大きな変更では、実装前にリポジトリとDBを調査し、実コード、現行schema、migration、RLS、保存処理を根拠にPlanを作る。DB変更を含む場合は、接続可能なREMOTEの実態も確認する。
- 要求仕様にない範囲へ拡張しない。曖昧さが結果を大きく変える場合だけ確認し、それ以外は最小で可逆的な実装を選ぶ。
- 推測でファイル名、route、テーブル名、column名、function名、RPC名を決めない。検索して実在を確認する。
- 既存コンポーネント、query、Server Action、RPC、保存基盤を確認してから新設する。既存の責務に自然に収まる場合は再利用する。
- unrelatedなリファクタリング、format変更、rename、依存更新を同じ作業へ混ぜない。
- 新しい重いライブラリは、既存依存と標準機能で解決できず、明確な必要性がある場合だけ追加する。依存追加は理由と影響を報告する。
- DB変更が不要ならmigrationを作らない。
- DB変更が必要な場合、新規migrationはSupabase CLIの `migration new` サブコマンドで作成する。現状はCLI設定／依存がリポジトリにないため、実際に利用可能なCLI起動方法とproject linkageを確認してから実行し、手作業でtimestamp付きファイル名を捏造しない。
- 適用済みの既存migrationを編集、rename、削除しない。既存の `002_...` から `005_...` までのlegacy version名もローカルmigration履歴として保持する。修正は新しいmigrationで行う。
- DB変更前後にローカルmigrationとREMOTE履歴を比較し、version／timestampを一致させる。現在確認済みのlegacy履歴差も、新しい本番migrationより前に、適用済みSQLを編集せず安全に整合する方法を調査してPlanへ含める。不一致を推測でrename、repair、再適用しない。
- Data APIのobject権限とRLSは別の層として扱う。公開schemaのtable、view、functionを新設または変更するときは、projectのData API設定を確認し、`anon`、`authenticated`、`service_role` へのGRANTを用途に必要な最小権限で明示的に検討する。権限エラー回避のために広いGRANTを追加せず、RLSだけでobject公開範囲まで保護できると仮定しない。
- 本番DBへ破壊的な検証データを作らない。既存データを用いる検証も、更新や削除を伴う場合は明示的な許可を得る。
- 複数テーブルを1操作として保存する処理は原子的に行う。既存の保存RPCとtransaction境界を確認し、途中成功が残るclient-sideの連続更新へ分解しない。
- `SECURITY DEFINER` をRLSや権限問題の回避目的で安易に使用しない。必要性がある場合は、脅威、所有者、固定 `search_path`、入力検証、実行権限を明示してレビューする。
- RPCは原則 `SECURITY INVOKER`、安全な `search_path`、schema-qualifiedな参照、最小限の実行権限を使用する。`public` / `anon` の不要なEXECUTEを残さず、RLSを前提にする。

## Verification policy

- 過剰なテスト、全画面E2E、全ブラウザ検証を標準工程にしない。変更に対応する最小限の検証を選ぶ。
- 原則として `npm run build` を必須とする。Windows PowerShellで `npm.ps1` が実行policyにより拒否される場合は、リポジトリ文書にあるとおり `npm.cmd run build` を使用する。Markdownのみなどbuild出力へ影響しない変更で省略する場合は、完了報告に理由を書く。
- 通常のコード変更では、対象に応じて既存の `npm run lint` も実行する。今回と無関係な既存警告を修正したり、今回の失敗として混ぜたりしない。
- 変更内容に重要な純粋ロジックがある場合だけ、小さく焦点を絞ったテストを追加する。既存の `tests/*.test.ts` はNodeの `node:test` 形式だが、現時点で専用npm scriptはないため、未定義の `npm test` を実行したことにしない。実行方法を確認できない場合は、その事実を報告する。
- UI変更は対象画面を中心に、原則1024px、1280px、1440pxのうち影響する主要幅だけ軽く確認する。スマートフォンは変更に破損リスクがある場合だけ致命的な崩れがないことを確認する。
- `npm run test:e2e:smoke` は既存のPlaywright smokeであり、UI、routing、auth変更など対象と合う場合に限って使う。全E2Eや `test:e2e:explore` を毎回の標準工程にしない。認証付きE2Eは既存の環境変数が安全に用意されている場合だけ行う。
- DB変更は対象schema、migration履歴、RLS、Data APIへのtable／view権限、functionのEXECUTE権限、既存データ保持だけを重点的に確認する。要求されていない本番書き込みテストを行わない。
- 原稿PDFを守る変更では、関連する印刷route、印刷component、印刷CSSに意図しない差分がないことを確認する。明示的に原稿PDFを変更した場合だけ、対象出力のDOM、目次、改ページ、余白、文字サイズを確認する。
- 検証で発見した無関係な既存警告や問題は、今回の変更へ混ぜず、必要なら残存事項として分離して報告する。

## Git and release

- `git add .` と `git add -A` を使用しない。今回変更した関連ファイルだけをpath指定してstageする。
- unrelatedなローカル変更、生成物、秘密情報をcommitへ含めない。作業開始前とstage前に `git status` と対象diffを確認する。
- commit、push、Supabase本番適用、Vercel公開は、ユーザーからその操作を明示的に許可された場合だけ行う。実装依頼だけをrelease許可と解釈しない。
- 本番公開は既存運用どおりGitHub `main` とVercel Git integrationを使い、`vercel deploy --prod` で手動公開しない。
- 許可済みの本番push後は、Vercel project `yoga-nurture` のproduction deploymentが `READY` になり、`https://yoga-nurture.vercel.app` が対象commitを配信していることを確認する。失敗またはtimeoutを成功として報告しない。
- Supabase本番migrationの適用とVercel公開を別の状態として報告する。片方の成功からもう片方の成功を推測しない。

## Completion report

完了報告には、短くても次の項目を必ず含める。該当しない項目も省略せず、`なし`、`未実施`、`未適用`、`対象外`など実態を記載する。

- 実装内容
- 主な変更ファイル
- migrationの有無と本番適用状況
- 最小限の検証結果（実行したcommand、対象画面／幅、未実行理由を含む）
- commit SHA（未commitなら `未commit`）
- push先（未pushなら `未push`）
- Vercel deployment状態（未公開なら `未実施`）
- 既存データの変換・削除件数（行っていなければ各0件）
- 残っている制限、未確認事項、既存問題
