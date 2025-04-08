---
devComUrl: https://developercommunity.visualstudio.com/t/Support-Filenamelinecolumn-format-in/10720994
thumbnailImage: ../media/code-search-go-to-line-parentheses-thumbnail.png
title: Улучшенная навигация по строкам & и столбцам
description: Теперь в Visual Studio реализована поддержка расширенной навигации по строкам и столбцам при поиске кода.
area: Productivity
featureId: AllInOneSearchLineNavigationNewFormatSupport

---


В [поиске кода](vscmd://Edit.NavigateTo) мы значительно расширили возможности навигации по строкам. Теперь поддерживаются следующие форматы:

- `:line` — переход к определенной строке в активном документе.
- `:line,col` — переход к определенной строке и столбцу в активном документе.
- `file:line` — переход к определенной строке в указанном файле.
- `file:line,col` — переход к определенной строке и столбцу в указанном файле.
- `file(line)` — переход к определенной строке в указанном файле.
- `file(line,col)` — переход к определенной строке и столбцу в указанном файле.

![Пример перехода к файлу, строке и столбцу](../media/code-search-go-to-line-parentheses.png)

Эти улучшения позволяют упростить быстрый поиск и редактирование кода, что повышает вашу производительность и оптимизирует вашу работу.
