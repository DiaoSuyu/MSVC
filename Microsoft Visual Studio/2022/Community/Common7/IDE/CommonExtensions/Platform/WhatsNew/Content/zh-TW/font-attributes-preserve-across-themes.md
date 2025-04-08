---
restartRequired: true
featureFlagName: Shell.ThemeAgnosticFontSettings
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: 跨佈景主題保留字型偏好設定
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: 現在，變更佈景主題將會保留您的字型和字型大小偏好設定。
area: IDE
featureId: preserveFontAcrossThemes

---


我們知道，撰寫程式碼時若是個人選擇，那麼開發人員選取的字型就會受到可讀性、可及性或美學偏好所影響。 Visual Studio 主題主要著重於簡報色彩，與您偏好的字型無關。

透過此更新，我們推出此功能，讓您在切換主題時保留字型和大小選擇。 您現在只需要在 Visual Studio 中設定一次字型就能切換主題時，不需要每次都要重新設定字型設定。 請注意，字型色彩會持續與主題連結，因為這就是主題的用途，但您的字型選擇會保留。

![Visual Studio 編輯器會使用相同字型來顯示相同的程式碼片段，但一半的程式碼是深色主題，另一半是淺色。](../media/FontAttributesPreserveAcrossThemes.png)

預設情況下，此功能會為所有使用者啟用。 如果您偏好之前的行為，請前往 [[工具] > [管理預覽功能](vscmd://Tools.ManagePreviewFeatures)]，然後尋找 [將字型設定與色彩主題選擇分開] 選項。 勾選此選項後，不論主題如何變更，您的字型偏好設定都會保持不變。 取消勾選方塊，就能恢復為之前將字型選擇連結至主題的行為。
