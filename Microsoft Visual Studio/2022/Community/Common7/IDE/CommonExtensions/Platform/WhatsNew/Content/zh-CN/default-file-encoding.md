---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: 自定义文件编码
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: 指定用于在 Visual Studio 中保存文件的默认编码。
area: Productivity
featureId: DefaultFileEncoding

---


在跨平台环境中工作的开发人员通常需要使用特定文件编码来保存文件。 更改这些编码可能会导致各种问题。

Visual Studio 现在允许设置保存文件时使用的默认文件编码。 此功能可确保尽可能使用首选编码。

要设置默认编码，请导航到**工具 > 选项 > 环境 > 文档**。 在那里，可以找到一个标题为**使用特定编码保存文件**的选项。 如果未选中此选项，则 Visual Studio 将使用其默认行为来管理文件编码。 如果选中了此选项，则 Visual Studio 将在保存文件时使用相邻组合框中指定的编码。

![工具\选项中的默认文件编码选项](../media/default-file-encoding.png)

如果 Visual Studio 无法使用指定的编码进行保存（例如，为包含 Unicode 字符的文件请求 *ASCII* 编码），则会显示一个对话框，告知你问题。
