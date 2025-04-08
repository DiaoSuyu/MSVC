---
restartRequired: true
featureFlagName: Git.UX.ReviewPullRequest
devComUrl: https://developercommunity.visualstudio.com/t/Use-Copilot-to-review-commit/10575248?q=code+review
thumbnailImage: ../media/17.13p2_local_code_review.png
title: 在提交时发现问题
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EWl1PdajOx1ImPgEUYMxF9QBeXLkJ5J7dHCA0rb_-b8uBQ?e=Z3zWG3
tags: top-story
description: 获取由 GitHub Copilot 提供支持的代码更改建议，以帮助你提前发现潜在问题并提高代码质量。
area: Git tooling
surveyUrl: https://aka.ms/LocalCodeReview
featureId: ailocalcodereview

---


现在，你甚至可以在提交之前获得对本地更改的 GitHub Copilot 代码审查！ 在 Visual Studio 中启用 Copilot 订阅并启用以下功能标志后，你可以在“Git 更改”窗口中看到新的闪烁评论按钮。 单击后，Copilot 将检查更改集，并在编辑器中内联提出一些建议。

![17.13P2 本地代码审查按钮](../media/17.13p2_local_code_review-button.png)

该模型可以指出关键问题，例如潜在的性能和安全问题，在早期发现时有助于降低将问题推送到远程代码库的风险。

![本地代码审查注释](../media/17.13p2_local_code_review.png)

确保你打开了以下两个功能标志：

- **工具** > **选项** > **预览功能** > **拉取请求注释**
- **工具** > **选项** > **GitHub** > **Copilot** > **源代码管理集成** > **启用 Git 预览功能**。

### 想尝试一下吗？
激活 GitHub Copilot Free，并解锁此 AI 功能，以及更多功能。
 无需试用。 无需信用卡。 只需要你的 GitHub 帐户 [获取 Copilot Free](vscmd://View.GitHub.Copilot.Chat)。
