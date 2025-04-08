---
devComUrl: https://developercommunity.visualstudio.com/t/Support-Filenamelinecolumn-format-in/10720994
thumbnailImage: ../media/code-search-go-to-line-parentheses-thumbnail.png
title: Ulepszona nawigacja po wierszach & kolumnach
description: Program Visual Studio obsługuje teraz zaawansowaną nawigację po wierszach i kolumnach przy wyszukiwaniu kodu.
area: Productivity
featureId: AllInOneSearchLineNavigationNewFormatSupport

---


W [wyszukiwaniu kodu](vscmd://Edit.NavigateTo) znacznie ulepszyliśmy możliwości nawigacji liniowej. Teraz obsługiwane są wszystkie następujące formaty:

- `:line`, aby przejść do określonego wiersza w aktywnym dokumencie
- `:line,col`, aby przejść do określonego wiersza i kolumny w aktywnym dokumencie
- `file:line`, aby przejść do określonego wiersza w określonym pliku
- `file:line,col`, aby przejść do określonego wiersza i kolumny w określonym pliku
- `file(line)`, aby przejść do określonego wiersza w określonym pliku
- `file(line,col)`, aby przejść do określonego wiersza i kolumny w określonym pliku

![Przykład pokazuje przechodzenie do pliku, wiersza i kolumny](../media/code-search-go-to-line-parentheses.png)

Wprowadzone ulepszenia ułatwiają szybką lokalizację i edycję kodu, zwiększanie produktywności i usprawnianie przepływu pracy.
