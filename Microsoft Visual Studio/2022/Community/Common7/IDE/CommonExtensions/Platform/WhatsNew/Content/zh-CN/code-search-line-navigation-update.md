---
devComUrl: https://developercommunity.visualstudio.com/t/Support-Filenamelinecolumn-format-in/10720994
thumbnailImage: ../media/code-search-go-to-line-parentheses-thumbnail.png
title: 增强的行和列导航
description: Visual Studio 现在支持代码搜索中的高级行和列导航。
area: Productivity
featureId: AllInOneSearchLineNavigationNewFormatSupport

---


在[代码搜索](vscmd://Edit.NavigateTo)中，我们大幅增强了行导航功能。 现在，支持以下格式：

- `:line`（用于导航到活动文档中的特定行）
- `:line,col`（用于导航到活动文档中的特定行和列）
- `file:line`（用于导航到特定文件中的特定行）
- `file:line,col`（用于导航到特定文件中的特定行和列）
- `file(line)`（用于导航到特定文件中的特定行）
- `file(line,col)`（用于导航到特定文件中的特定行和列）

![示例显示了如何导航到文件、行和列](../media/code-search-go-to-line-parentheses.png)

通过这些改进，可以更容易地快速查找和编辑代码、提高工作效率和简化工作流。
