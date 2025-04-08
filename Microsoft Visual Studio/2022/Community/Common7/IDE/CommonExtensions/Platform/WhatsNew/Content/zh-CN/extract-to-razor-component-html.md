---
devComUrl: https://github.com/dotnet/razor/issues/6187
thumbnailImage: ../media/extract-to-razor-component-thumbnail.png
title: 将 HTML 提取到 Razor 组件
description: 使用代码操作轻松地将 HTML 提取到 Visual Studio 内的 Razor 组件中。
area: Web
featureId: extract-to-razor-component-html

---


你是否发现自己向 *.razor* 文件添加了太多代码，并希望通过一种简单的方法将其移到自己的可重用组件中？ 现在，在 Razor 文件中使用 HTML 时，你可以使用 `CTRL+.` 或右键单击，并选择**快速操作和重构**，以自动将所选 HTML 标记提取到 Visual Studio 内的新 Razor 组件中。

在此第一次迭代中，*将元素提取到新组件中*功能仅支持 HTML 标记选择。 

![要提取到新 Razor 组件的 HTML 标记示例](../media/extract-to-razor-component.png)

通过此增强功能，你可以轻松模块化 Razor 组件，从而简化工作流。
