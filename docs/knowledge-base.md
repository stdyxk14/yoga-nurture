# AIメンター学習メモ / 知識ベース

この機能は、手書きメモ画像/PDFをアップロードし、OCR結果を人間が確認してからAIメンター用の知識カードに整理するための土台です。

## 今回の対応範囲

- `knowledge_documents` に手書きメモ・PDF・テキストメモを保存
- `knowledge_cards` に確認済みテキストから作った知識カード下書き/有効カードを保存
- Supabase Storage bucket `knowledge-files` にファイルを保存
- `/settings/knowledge` で学習メモ一覧を表示
- `/settings/knowledge/upload` でファイルアップロード
- `/settings/knowledge/[id]` で詳細と知識カード候補を表示
- `/settings/knowledge/[id]/review` でOCR読み取り結果を確認・修正
- jpg/png/webp 画像は「AIで読み取る」ボタンからOpenAI Vision OCRを実行
- `cleaned_text` からAIで知識カード候補を作成し、ユーザー確認後に有効化
- 有効化済み知識カードを既存AI提案promptに最大3件まで参考情報として追加

## Supabase適用手順

Supabase SQL Editorで以下を実行してください。

- `supabase/migrations/003_knowledge_base.sql`

このmigrationには以下が含まれます。

- `knowledge_documents`
- `knowledge_cards`
- RLS policy
- Storage bucket `knowledge-files`
- Storage objects policy

bucketのファイルパスはユーザーごとに分かれます。

```text
{user_id}/{document_id}/{original_filename}
```

## OCRの扱い

手書きOCRは誤認識がある前提のため、OCR結果は必ず確認画面で人間が修正してから知識カード化します。

- jpg/png/webp はアップロード後に `/review` 画面または詳細画面から「AIで読み取る」を実行できます
- OCR中は `ocr_processing`、確認待ちは `ocr_review_needed`、失敗時は `error` になります
- PDFはアップロード・保存・プレビューに対応していますが、自動OCRはまだ準備中です
- PDFは別タブで開き、必要な本文を `/review` 画面に手動で貼り付けてください
- `cleaned_text` が保存されると、AIで知識カード候補を作成できます

OpenAI APIキーはサーバー側の `OPENAI_API_KEY` のみを使います。`NEXT_PUBLIC_` 付きの環境変数には入れないでください。

## AI提案への参照

`knowledge_cards.status = active` のカードは、既存のAI提案実行時に最大3件までpromptへ追加されます。

- 生徒カルテAI提案
- レッスンプランAI提案
- ブロック原稿AI提案
- レッスン後振り返りAI

本格RAGやベクトル検索はまだ行わず、`mentor_type` が一致するカードと `general` カードを優先します。参照された内容は `ai_suggestions.source_summary` に残ります。

## 今後の拡張メモ

- PDFのページ分割/OCR
- embeddings / ベクトル検索
- 大量ファイル処理のバックグラウンド化
