---
devComUrl: 
thumbnailImage: ../media/editable-expression-syntax-highlight-thumbnail.png
title: Highlight syntax with IEnumerable Visualizer
specUrl: https://devdiv.visualstudio.com/DevDiv/_workitems/edit/2253294
description: Enhanced editable expression with syntax highlighting is now available.
area: Debugging & diagnostics
featureId: editable-expression-syntax-highlight

---


Writing LINQ expressions can get tricky, especially as they grow complex. Visual Studio 2022 now introduces **syntax highlighting** in the **IEnumerable Visualizer Editable Expression**.

Syntax highlighting applies different colors to specific parts of your queries, such as classes, enums, delegates, structures, and keywords. This makes it simple to spot various components in your LINQ expressions and see the logical flow at a glance, leading to clearer, more maintainable code.

![IEnumerable Visualizer Syntax Highlighting](../media/editable-expression-syntax-highlighting.png)

### Customize syntax highlighting

Visual Studio allows you to customize the color scheme to suit your preferences. To personalize your colors:

1. Go to **Tools > Options > Environment > Fonts and Colors**.
2. Select **Text Editor** from the **Show settings for** dropdown.
3. Adjust each **User Types** item's color to match your coding style.
