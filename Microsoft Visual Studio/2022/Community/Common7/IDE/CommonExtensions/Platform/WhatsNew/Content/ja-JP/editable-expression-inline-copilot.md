---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/Integrated-Linq-Editor/442398
thumbnailImage: ../media/editable-expression-copilot-thumbnail.png
title: 複雑な LINQ クエリを作成する
specUrl: https://microsoft.sharepoint.com/:p:/t/VisualStudioProductTeam/ETycaBw7iJdFhgYRYWGSa34BXJEaakZ2PCrAWHmhkEbAsA?e=7hIYoO
description: IEnumerable ビジュアライザー内で直接 GitHub Copilot インライン チャットを使用できることにより、編集可能な式機能が強化されました。
area: Debugging & diagnostics
featureId: editable-expression-inline-copilot

---


IEnumerable ビジュアライザーに編集可能な式のインライン チャット機能が追加されました。これによってユーザーは IEnumerable ビジュアライザー内で AI を直接活用して、編集可能な式に複雑な LINQ クエリを作成できるようになりました。 

![IEnumerable ビジュアライザーのインライン チャット](../media/editable-expression-inline-copilot.mp4)

### 編集可能な式のインライン チャット

インライン チャットを起動するには、編集可能な式テキスト ボックスの右下隅にある GitHub Copilot のスパークル ボタンをクリックするだけです。 これにより、元の編集可能な式の上にテキスト ボックスが開き、"*現在の式をどのように調整するかを説明してください*" というプロンプトが表示されます。 自然言語で要求を入力し、完了したら**送信ボタン**をクリックします。

GitHub Copilot により、入力に基づく LINQ クエリが生成され、既定では自動的に実行されます。 クエリが正常に生成され、適用されたことを確認するには、緑色のチェックマークを探します。これは、GitHub Copilot によって生成された LINQ クエリが完全に実行され、適用されたことを示します。

### GitHub Copilot チャットに進む
GitHub Copilot によって 1 つ以上の LINQ クエリが生成されると、テキスト ボックスの右上隅の見やすい位置に **[チャットの続行]** ボタンが表示されます。 

このボタンをクリックすると、専用の GitHub Copilot チャット ウィンドウが開き、クエリの調整、フォローアップの質問、代替アプローチの詳しい検討を行うことができます。 この統合により、GitHub Copilot のすべての機能を活用しながら、制御と柔軟性を維持できます。

![編集可能な式のインライン GitHub Copilot](../media/editable-expression-copilot.png)

ビジュアライザーに戻る場合は、**[ビジュアライザーで表示]** ボタンをクリックします。 これにより、ビジュアライザー環境にシームレスに切り替えて、チャット セッション中に生成された変更を表示または適用できます。

この機能により、ビジュアライザーと GitHub Copilot チャットの間のスムーズなワークフローが実現します。 ビジュアライザーのインライン チャットは、簡単な編集や小さな調整に最適化されていますが、GitHub Copilot チャットは、より詳細な調整や反復的な改善の処理に優れています。どちらも編集可能な式の LINQ クエリの生成をより簡単かつ効率的にすることを目的としています。

### さっそくこれを試してみましょう。
GitHub Copilot Free をアクティブ化し、この AI 機能のロックを解除します。
 試用版なし。 クレジット カード不可。 GitHub アカウントだけでいいのです。 [Copilotを無料でゲットしよう](vscmd://View.GitHub.Copilot.Chat)。
