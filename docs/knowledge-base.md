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

Phase 1では、OCRの完全自動化よりも確認フローを優先しています。

- 画像/PDFはアップロード後に `ocr_pending` になります
- `/review` 画面でOCR結果または手入力の読み取り結果を貼り付け/修正できます
- `cleaned_text` が保存されると、知識カード下書きを作成できます

OpenAI Visionや外部OCRによる自動読み取りは次フェーズで追加します。手書きOCRは誤認識が前提のため、AIメンターが参照する前に必ず人間確認済みテキストを保存してください。

## 今後の拡張メモ

- OpenAI Visionで画像OCRを実行
- PDFのページ分割/OCR
- `knowledge_cards.status = active` のカードをAI提案promptに最大3件程度含める
- embeddings / ベクトル検索
- 大量ファイル処理のバックグラウンド化
