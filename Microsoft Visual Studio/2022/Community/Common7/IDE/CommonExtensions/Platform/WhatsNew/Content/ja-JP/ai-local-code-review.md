---
restartRequired: true
featureFlagName: Git.UX.ReviewPullRequest
devComUrl: https://developercommunity.visualstudio.com/t/Use-Copilot-to-review-commit/10575248?q=code+review
thumbnailImage: ../media/17.13p2_local_code_review.png
title: コミット時に問題を発見する
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EWl1PdajOx1ImPgEUYMxF9QBeXLkJ5J7dHCA0rb_-b8uBQ?e=Z3zWG3
tags: top-story
description: コード変更に関する GitHub Copilot からの提案を利用すると、潜在的な問題を早期に発見し、コードの品質を向上させることができます。
area: Git tooling
surveyUrl: https://aka.ms/LocalCodeReview
featureId: ailocalcodereview

---


コミットする前に、ローカルの変更に関して GitHub Copilot コード レビューを受けることができるようになりました。 Visual Studio で Copilot サブスクリプションを有効にし、以下の機能フラグを有効にすると、[Git の変更] ウィンドウに新しい [スパークル コメント] ボタンが表示されます。 クリックすると、Copilot によって変更内容の確認が行われ、提案がエディタ内にインラインで表示されます。

![17.13P2 ローカル コード レビュー ボタン](../media/17.13p2_local_code_review-button.png)

このモデルでは、潜在的なパフォーマンスやセキュリティの問題などの重大な問題を指摘することができます。早い段階で問題を発見すれば、リモート コード ベースに問題が持ち込まれるリスクを軽減するために役立ちます。

![ローカル コード レビュー コメント](../media/17.13p2_local_code_review.png)

次の機能フラグがどちらもオンになっていることを確認します。

- **[ツール]** > **[オプション]** > **[プレビュー機能]** > **[プル リクエスト コメント]**
- **[ツール]** > **[オプション]** > **[GitHub]** > **[Copilot]** > **[ソース管理の統合]** > **[Git プレビュー機能の有効化]**。

### さっそくこれを試してみましょう。
GitHub Copilot Free をアクティブ化し、この AI 機能のロックを解除します。
 試用版なし。 クレジット カード不可。 GitHub アカウントだけでいいのです。 [Copilotを無料でゲットしよう](vscmd://View.GitHub.Copilot.Chat)。
