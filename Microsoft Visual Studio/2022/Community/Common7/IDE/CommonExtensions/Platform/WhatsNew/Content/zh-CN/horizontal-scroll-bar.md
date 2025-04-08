---
devComUrl: https://developercommunity.visualstudio.com/t/fix-scroll-bars/1087969
thumbnailImage: ../media/horizontal-scroll-bar-thumbnail.png
title: 重构水平滚动条
description: 编辑器中的水平滚动条现在可自行重新定位以便始终可访问，即使空间有限也不例外。
area: Productivity
featureId: EditorHorizontalScrollbarPersistence

---


Visual Studio 中的编辑器托盘是存储大量信息的宝贵空间。 你可以控制缩放、检查文档的运行状况、查看所打开的行并访问各种附加信息。

遗憾的是，有时所有这些信息都可能会挤出水平滚动条，因此导致很难在窗口内滚动。 这在系统托盘不很宽的并排视图中尤其如此。

有了最新更新，这些困难已成为历史。 如果滚动条位于可用宽度下方，那么它将在系统托盘上方自行重新定位，并确保它始终可访问。 默认情况下，只要有足够的空间，它就会返回到编辑器托盘中。

![显示在编辑器托盘上方的水平滚动条](../media/horizontal-scroll-bar-thumbnail.png)

虽然我们认为此行为对于大多数用户来说都是理想的，但如果遇到相关问题，可以在**工具 > 选项**中控制该行为。 此选项位于**文本编辑器 > 高级**下面，并标记为**编辑器水平滚动条位置**。 此设置允许你选择滚动条是根据可用空间调整其位置、停留在编辑器托盘中，还是始终显示在编辑器托盘上方。

![水平滚动条设置](../media/horizontal-scroll-bar-setting.png)
