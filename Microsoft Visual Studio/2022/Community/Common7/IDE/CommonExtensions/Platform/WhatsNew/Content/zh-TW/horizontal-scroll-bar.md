---
devComUrl: https://developercommunity.visualstudio.com/t/fix-scroll-bars/1087969
thumbnailImage: ../media/horizontal-scroll-bar-thumbnail.png
title: 重新構想的水平捲軸
description: 編輯器中的水平捲軸現在會重新定位，以便始終可供存取，即使在空間有限的情況下。
area: Productivity
featureId: EditorHorizontalScrollbarPersistence

---


Visual Studio 中的編輯器匣是儲存大量資訊的寶貴空間。 您可以控制縮放、檢查文件的運作狀況、查看您所在的行以及存取各種附加資訊。

不幸的是，有時所有這些資訊會擠滿水平捲軸，導致難以捲動視窗。 當系統匣不是很寬時，使用並排檢視更是如此。

有了這項最新更新，這些難題已不復存在。 如果捲軸低於可用寬度，它將重新定位到系統匣上方，以確保始終可存取。 預設情況下，只要有足夠的空間，它就會回到編輯器匣。

![水平捲軸，顯示在編輯器匣上方](../media/horizontal-scroll-bar-thumbnail.png)

雖然我們相信這種行為對大多數使用者來說都是理想的，但如果您遇到任何問題，您可以在 **[工具 > 選項]** 中控制行為。 這個選項位於 **文字編輯器 > 進階**下方，標記為 **編輯器水平捲軸位置**。 此設定可讓您選擇捲軸是否根據可用空間調整其位置、停留在編輯器匣中，或始終出現在編輯器匣上方。

![水平捲軸設定](../media/horizontal-scroll-bar-setting.png)
