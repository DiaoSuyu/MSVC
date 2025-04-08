---
restartRequired: true
featureFlagName: Shell.ThemeAgnosticFontSettings
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: 跨主题保留字体首选项
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: 更改主题现在将保留字体和字体大小首选项。
area: IDE
featureId: preserveFontAcrossThemes

---


我们理解，开发人员在编码时选择的字体是个人选择，受可读性、辅助功能或美学偏好的影响。 Visual Studio 主题主要侧重于演示颜色，与你的首选字体无关。

通过此更新，我们引入了在切换主题时保留字体和大小选项的功能。 现在，你可以在 Visual Studio 中设置一次字体首选项，并切换主题，而无需每次重新配置字体设置。 请注意，字体的颜色仍然与主题相关联，因为这是主题的目的，但你的字体选择将被保留。

![Visual Studio 编辑器使用相同字体显示相同的代码段，但其中一半的代码采用深色主题，一半为浅色。](../media/FontAttributesPreserveAcrossThemes.png)

默认情况下，将为所有用户启用此功能。 如果你更喜欢以前的行为，请转到[工具>管理预览功能](vscmd://Tools.ManagePreviewFeatures)，找到** 将字体设置与颜色主题选择分开**的选项。 如果选中此选项，则无论主题如何更改，你的字体首选项都将保持不变。 取消选中该框，以恢复将字体选择与主题绑定的上一行为。
