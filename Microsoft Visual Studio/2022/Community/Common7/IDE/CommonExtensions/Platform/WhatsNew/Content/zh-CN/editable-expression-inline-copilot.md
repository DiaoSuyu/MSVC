---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/Integrated-Linq-Editor/442398
thumbnailImage: ../media/editable-expression-copilot-thumbnail.png
title: 创建复杂的 LINQ 查询
specUrl: https://microsoft.sharepoint.com/:p:/t/VisualStudioProductTeam/ETycaBw7iJdFhgYRYWGSa34BXJEaakZ2PCrAWHmhkEbAsA?e=7hIYoO
description: 通过 GitHub Copilot 内联聊天直接在 IEnumerable 可视化工具中增强的可编辑表达式。
area: Debugging & diagnostics
featureId: editable-expression-inline-copilot

---


IEnumerable 可视化工具现在为其可编辑表达式提供内联聊天功能，使用户能够直接在 IEnumerable 可视化工具中利用 AI 为可编辑的表达式创建复杂的 LINQ 查询。 

![IEnumerable 可视化工具内联聊天](../media/editable-expression-inline-copilot.mp4)

### 可编辑的表达式内联聊天

要调出内联聊天，只需单击位于可编辑表达式文本框右下角的 GitHub Copilot 闪烁按钮。 这将打开原始可编辑表达式上方的文本框，并显示*描述你想要如何优化当前的表达式*。 以自然语言输入你的请求，准备就绪后，单击**提交按钮**。

GitHub Copilot 将基于输入生成 LINQ 查询，并默认自动执行此查询。 要确认已成功生成并应用查询，请查找绿色复选标记，绿色复选标记表示已完全执行并应用 GitHub Copilot 生成的 LINQ 查询。

### 继续进行 GitHub Copilot 聊天
在 GitHub Copilot 生成至少一个 LINQ 查询后，该功能还会包括一个**继续聊天**按钮，此按钮位于文本框的右上角，非常方便。 

单击此按钮将打开专用的 GitHub Copilot 聊天窗口，你可以在其中优化查询、提出后续问题或更详细地探索替代方法。 此集成可确保在利用 GitHub Copilot 的完整功能的同时保持控制和灵活性。

![可编辑表达式内联 GitHub Copilot](../media/editable-expression-copilot.png)

准备好返回到可视化工具时，只需单击**在可视化工具中显示**按钮即可。 这样，你便可以无缝转换回可视化工具环境，你可以在其中查看或应用聊天会话期间生成的更改。

此功能可在可视化工具与 GitHub Copilot Chat 之间提供流畅的工作流。 可视化工具内联聊天针对快速编辑和小调整进行了优化，而 GitHub Copilot Chat 擅长处理更详细的优化和迭代改进，两者都旨在更轻松、更高效地生成可编辑表达式的 LINQ 查询。

### 想尝试一下吗？
激活 GitHub Copilot Free，并解锁此 AI 功能，以及更多功能。
 无需试用。 无需信用卡。 只需要你的 GitHub 帐户 [获取 Copilot Free](vscmd://View.GitHub.Copilot.Chat)。
