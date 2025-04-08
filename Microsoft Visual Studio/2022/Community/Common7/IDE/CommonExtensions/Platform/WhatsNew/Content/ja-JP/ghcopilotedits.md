---
thumbnailImage: ../media/ghcpedits-thumbnail.png
title: ファイル間で GitHub Copilot 編集を使用する
description: 複数のファイルをより効率的に反復処理します。
area: GitHub Copilot
featureId: GitHubCopilotMultiFileEdits

---


Visual Studio の Copilot では、複数のファイルにわたる反復処理をより効率的に行うために設計された機能である Copilot Edits を使用して、コードを調整できるようになりました。

まず、Copilot Chat パネルの上部で Edits スレッドを作成するボタンをクリックします。

![Copilot Edits の図](../media/ghcpedits.png)

Copilot Edits は、チャットの会話の流れとインライン レビュー エクスペリエンスを組み合わせて、開発者を支援します。

1. **明確なプレビュー**: Copilot Edits では、影響を受けるファイルと提案された変更の概要がまず表示されるため、何が起こっているかを正確に把握できます。
2. **フローによるレビュー**: エディター内で直接、コードの差分がインライン表示されます。 `TAB` キーまたは `Alt+Del` キーを使用して個々の変更を承認または拒否することも、すべて一括で適用/拒否することもできます。
3. **確信を持って反復する**: チェックポイントを使用すると、コードファイルの以前の反復を再確認したり、必要なときにいつでも別のアプローチを試すことができます。再びインスピレーションが湧いたときに便利です。

概要としては、まず自然な言語で変更内容を記述し、Copilot Chat で既に行っているように、# キーを使用して特定のファイル、エラー、またはソリューションを参照します。

### さっそくこれを試してみましょう。
GitHub Copilot Free をアクティブ化し、この AI 機能のロックを解除します。
 試用版なし。 クレジット カード不可。 GitHub アカウントだけでいいのです。 [Copilotを無料でゲットしよう](vscmd://View.GitHub.Copilot.Chat)。
