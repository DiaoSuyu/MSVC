---
devComUrl: https://developercommunity.visualstudio.com/t/Support-Filenamelinecolumn-format-in/10720994
thumbnailImage: ../media/code-search-go-to-line-parentheses-thumbnail.png
title: Enhanced line & column navigation
description: Visual Studio now supports advanced line and column navigation in Code Search.
area: Productivity
featureId: AllInOneSearchLineNavigationNewFormatSupport

---


In [Code Search](vscmd://Edit.NavigateTo), we've significantly enhanced line navigation capabilities. The following formats are now supported:

- `:line` to navigate to a specific line in the active document
- `:line,col` to navigate to a specific line and column in the active document
- `file:line` to navigate to a specific line in a specified file
- `file:line,col` to navigate to a specific line and column in a specified file
- `file(line)` to navigate to a specific line in a specified file
- `file(line,col)` to navigate to a specific line and column in a specified file

![Example showing navigation to file, line, and column](../media/code-search-go-to-line-parentheses.png)

These improvements make it easier to quickly locate and edit code, enhancing your productivity and streamlining your workflow.
