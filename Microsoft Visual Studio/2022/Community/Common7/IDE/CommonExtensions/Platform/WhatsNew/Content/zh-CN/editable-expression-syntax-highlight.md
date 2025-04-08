---
devComUrl: 
thumbnailImage: ../media/editable-expression-syntax-highlight-thumbnail.png
title: 使用 IEnumerable 可视化工具突出显示语法
specUrl: https://devdiv.visualstudio.com/DevDiv/_workitems/edit/2253294
description: 突出显示语法的增强型可编辑表达式现已推出。
area: Debugging & diagnostics
featureId: editable-expression-syntax-highlight

---


编写 LINQ 表达式可能会变得很棘手，尤其是在它们变得复杂时。 现在，Visual Studio 2022 在 **IEnumerable 可视化工具可编辑表达式**中引入了**语法突出显示**功能。

语法突出显示将不同颜色应用于查询的特定部分，例如类、枚举、委托、结构和关键字。 这样，就可以轻松地在 LINQ 表达式中发现各种组件，并一目了然地查看逻辑流，从而使代码更清晰、更易于维护。

![IEnumerable 可视化工具语法突出显示](../media/editable-expression-syntax-highlighting.png)

### 自定义语法突出显示

Visual Studio 允许自定义配色方案以符合你的偏好。 要对颜色进行个性化设置，请执行以下操作：

1. 转到**工具 > 选项 > 环境 > 字体和颜色**。
2. 从**显示设置**下拉列表中，选择**文本编辑器**。
3. 调整每个**用户类型**项的颜色以匹配编码样式。
