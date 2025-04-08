---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/Integrated-Linq-Editor/442398
thumbnailImage: ../media/editable-expression-copilot-thumbnail.png
title: 製作複雜的 LINQ 查詢
specUrl: https://microsoft.sharepoint.com/:p:/t/VisualStudioProductTeam/ETycaBw7iJdFhgYRYWGSa34BXJEaakZ2PCrAWHmhkEbAsA?e=7hIYoO
description: 使用 GitHub Copilot Inline Chat 直接在 IEnumerable 視覺化檢視中增強的可編輯運算式。
area: Debugging & diagnostics
featureId: editable-expression-inline-copilot

---


IEnumerable 視覺化檢視現在具有可編輯運算式的內嵌聊天功能，讓使用者可以直接在 IEnumerable 視覺化檢視內運用 AI，為可編輯的運算式製作複雜的 LINQ 查詢。 

![IEnumerable 視覺化檢視內嵌聊天](../media/editable-expression-inline-copilot.mp4)

### 可編輯運算式內嵌聊天

要調出內嵌聊天，只需按一下位於可編輯運算式文字方塊右下角的 GitHub Copilot 閃光按鈕。 這會開啟原始可編輯運算式上方的文字方塊，並顯示 *[描述您要如何精簡目前運算式]* 的提示。 以自然語言輸入您的要求，一旦準備就緒，請按一下 **[提交] 按鈕**。

GitHub Copilot 會根據您的輸入產生 LINQ 查詢，並預設自動執行它。 若要確認查詢已成功產生並套用，請尋找綠色核取記號，這表示 GitHub Copilot 所產生的 LINQ 查詢已完全執行並套用。

### 繼續前往 GitHub Copilot Chat
此功能還包括一個 **[在聊天中繼續]** 按鈕，當 GitHub Copilot 至少產生一個 LINQ 查詢後，該按鈕會方便地顯示在文字方塊的右上角。 

按一下此按鈕會開啟專用的 GitHub Copilot Chat 視窗，您可以在其中精簡查詢、詢問後續問題，或更詳細地探索替代方法。 此整合可確保您保有控制權和彈性，同時運用 GitHub Copilot 的完整功能。

![可編輯運算式內嵌 GitHub Copilot](../media/editable-expression-copilot.png)

當您準備退回視覺化檢視時，只要按一下 [在視學化檢視中顯示]**** 按鈕即可。 這可讓您順暢地轉換回視覺化檢視環境，您可以在其中檢視或套用聊天工作階段中產生的變更。

此功能在視覺化工具和 GitHub Copilot Chat 之間提供了流暢的工作流程。 內嵌聊天已針對快速編輯和小調整進行了最佳化，而 GitHub Copilot Chat 則擅長處理更詳細的細化和迭代改進，兩者旨在更輕鬆、更有效率地產生可編輯運算式的 LINQ 查詢。

### 想要試用嗎？
啟用 GitHub Copilot 免費版，即可解鎖此 AI 功能以及更多功能。
 無試用期限。 無需信用卡。 只需擁有 GitHub 帳戶即可。 [取得 Copilot 免費版](vscmd://View.GitHub.Copilot.Chat)。
