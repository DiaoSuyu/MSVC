---
devComUrl: https://github.com/dotnet/razor/issues/6187
thumbnailImage: ../media/extract-to-razor-component-thumbnail.png
title: Wyodrębnianie kodu HTML do składnika Razor
description: Możesz łatwo wyodrębnić kod HTML do składnika Razor w programie Visual Studio za pomocą akcji kodu.
area: Web
featureId: extract-to-razor-component-html

---


Czy kiedykolwiek zdarzyło Ci się dodać zbyt dużej ilości kodu do pliku *.razor* i potrzebowałeś/potrzebowałaś łatwo przenieść go do własnego składnika wielokrotnego użytku? Podczas pracy z kodem HTML w pliku Razor możesz teraz użyć `CTRL+.` lub kliknąć prawym przyciskiem myszy i wybrać pozycję **szybkie akcje i refaktoryzacje**, aby automatycznie wyodrębnić wybrany znacznik HTML do nowego składnika Razor w programie Visual Studio.

W pierwszej iteracji *wyodrębnianie elementu do nowego składnika* jest obsługiwane tylko w przypadku zaznaczeń znaczników HTML. 

![Przykład wyodrębniania znaczników HTML do nowego składnika Razor](../media/extract-to-razor-component.png)

To ulepszenie usprawnia przepływ pracy, umożliwiając bezproblemowe modularyzowanie składników Razor.
