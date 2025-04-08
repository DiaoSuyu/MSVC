---
devComUrl: 
thumbnailImage: ../media/editable-expression-syntax-highlight-thumbnail.png
title: Wyróżnianie składni za pomocą wizualizatora IEnumerable
specUrl: https://devdiv.visualstudio.com/DevDiv/_workitems/edit/2253294
description: Ulepszone wyrażenie edytowalne z wyróżnianiem składni jest już dostępne.
area: Debugging & diagnostics
featureId: editable-expression-syntax-highlight

---


Pisanie wyrażeń LINQ może być kłopotliwe, zwłaszcza gdy zwiększa się ich złożoność. Program Visual Studio 2022 wprowadza teraz **wyróżnianie składni** w **wyrażeniu edytowalnym wizualizatora IEnumerable**.

Wyróżnianie składni polega na stosowaniu różnych kolorów do określonych części zapytań, takich jak klasy, wyliczenia, delegaci, struktury i słowa kluczowe. Upraszcza to odnajdowanie różnych składników w wyrażeniach LINQ i błyskawiczne wyświetlanie przepływu logicznego, co skutkuje bardziej przejrzystym i łatwiejszego w utrzymaniu kodu.

![Wyróżnianie składni wizualizatora IEnumerable](../media/editable-expression-syntax-highlighting.png)

### Dostosowywanie wyróżniania składni

Program Visual Studio umożliwia dostosowanie schematu kolorów zgodnie z preferencjami. Aby spersonalizować kolory:

1. Przejdź do **Narzędzia > Opcje > Środowisko > Czcionki i kolory**.
2. Wybierz **Edytor tekstowy** z listy rozwijanej **Pokaż ustawienia** .
3. Dostosuj kolor każdego elementu **Typy użytkowników**, aby był zgodny ze stylem kodowania.
