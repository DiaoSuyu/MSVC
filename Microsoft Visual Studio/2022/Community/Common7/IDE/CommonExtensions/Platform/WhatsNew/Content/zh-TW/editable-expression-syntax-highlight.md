---
devComUrl: 
thumbnailImage: ../media/editable-expression-syntax-highlight-thumbnail.png
title: 以 IEnumerable 視覺化檢視醒目提示語法
specUrl: https://devdiv.visualstudio.com/DevDiv/_workitems/edit/2253294
description: 現已提供包含語法醒目提示的增強型可編輯運算式。
area: Debugging & diagnostics
featureId: editable-expression-syntax-highlight

---


撰寫 LINQ 運算式可能會很棘手，尤其是當它們越來越複雜時。 現在，Visual Studio 2022 將**語法醒目提示**引進 **IEnumerable 視覺化檢視中的可編輯運算式**。

語法醒目提示將不同的色彩套用到查詢中的特定部分，例如類別、列舉、委派、結構和關鍵字。 這樣可以讓您輕鬆地在 LINQ 運算式中找到各種元件，並一目了然地查看邏輯流程，以提供更清楚且更易於維護的程式碼。

![IEnumerable 視覺化檢視語法醒目提示](../media/editable-expression-syntax-highlighting.png)

### 自訂語法醒目提示

Visual Studio 可讓您根據自己的偏好自訂色彩配置。 若要個人化您的色彩：

1. **** 前往 [工具] > [選項] > [環境] > [字型和色彩]。
2. ******** 從 [顯示設定] 下拉式清單中選取 [文字編輯器]。
3. 調整每個**使用者類型**項目的色彩，以符合您的程式碼撰寫樣式。
