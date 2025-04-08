---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: 自訂檔案編碼
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: 指定在 Visual Studio 中儲存檔案的預設編碼。
area: Productivity
featureId: DefaultFileEncoding

---


在跨平台環境中工作的開發人員經常需要使用特定的文件檔案來儲存檔案。 改變這些編碼可能會導致各種問題。

Visual Studio 現在可讓您設定用於儲存檔案的預設檔案編碼。 此功能可確保系統盡量使用您慣用的編碼方式。

若要設定預設編碼方式，請導覽至 **[工具] > [選項] > [環境] > [文件]**。 在那裡，您將找到一個名為 **[使用特定編碼儲存檔案]** 的選項。 如果未選取此選項，Visual Studio 將使用其預設行為管理檔案編碼。 如果選取此選項，Visual Studio 將在儲存檔案時使用相鄰下拉式方塊中指定的編碼方式。

![工具\選項中的預設檔案編碼選項](../media/default-file-encoding.png)

如果 Visual Studio 無法使用指定的編碼方式儲存 (例如，要求對包含 Unicode 字元的檔案進行 *ASCII* 編碼)，它將會顯示對話方塊，以通知您此問題。
