---
devComUrl: https://developercommunity.visualstudio.com/t/Support-Filenamelinecolumn-format-in/10720994
thumbnailImage: ../media/code-search-go-to-line-parentheses-thumbnail.png
title: Spostamento migliorato tra righe e colonne
description: Visual Studio ora supporta lo spostamento avanzato tra righe e colonne in Code Search.
area: Productivity
featureId: AllInOneSearchLineNavigationNewFormatSupport

---


In [Code Search](vscmd://Edit.NavigateTo) sono state migliorate notevolmente le funzionalità di spostamento tra righe. Sono ora supportati i seguenti formati:

- `:line` per spostarsi su una riga specifica nel documento attivo
- `:line,col` per spostarsi su una riga e una colonna specifiche nel documento attivo
- `file:line` per spostarsi su una riga specifica in un file specificato
- `file:line,col` per spostarsi su una riga e una colonna specifiche in un file specificato
- `file(line)` per spostarsi su una riga specifica in un file specificato
- `file(line,col)` per spostarsi su una riga e una colonna specifiche in un file specificato

![Esempio che mostra lo spostamento su un file, una riga e una colonna](../media/code-search-go-to-line-parentheses.png)

Questi miglioramenti semplificano e velocizzano l'individuazione e la modifica del codice, ottimizzando la produttività e semplificando il flusso di lavoro.
