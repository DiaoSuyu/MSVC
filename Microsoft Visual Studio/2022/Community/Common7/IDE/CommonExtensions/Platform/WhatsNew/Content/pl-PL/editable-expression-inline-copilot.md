---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/Integrated-Linq-Editor/442398
thumbnailImage: ../media/editable-expression-copilot-thumbnail.png
title: Tworzenie złożonych zapytań LINQ
specUrl: https://microsoft.sharepoint.com/:p:/t/VisualStudioProductTeam/ETycaBw7iJdFhgYRYWGSa34BXJEaakZ2PCrAWHmhkEbAsA?e=7hIYoO
description: Ulepszone wyrażenie edytowalne za pomocą funkcji czatu wbudowanego w usłudze GitHub Copilot bezpośrednio w wizualizatorze IEnumerable.
area: Debugging & diagnostics
featureId: editable-expression-inline-copilot

---


Wizualizator IEnumerable oferuje teraz wbudowany czat dla jego edytowalnego wyrażenia, umożliwiając użytkownikom korzystanie ze sztucznej inteligencji bezpośrednio w wizualizatorze IEnumerable w celu tworzenia złożonych zapytań LINQ dla edytowalnego wyrażenia. 

![Czat wbudowany wizualizatora IEnumerable](../media/editable-expression-inline-copilot.mp4)

### Czat wbudowany z możliwością edycji wyrażeń

Aby wyświetlić wbudowany czat, po prostu kliknij przycisk GitHub Copilot znajdujący się w prawym dolnym rogu pola tekstowego edytowalnego wyrażenia. Spowoduje to otwarcie pola tekstowego powyżej oryginalnego wyrażenia edytowalnego z monitem o treści *Opisz, jak chcesz uściślić bieżące wyrażenie*. Wprowadź żądanie w języku naturalnym, a gdy wszystko będzie gotowe, kliknij **przycisk Prześlij**.

Narzędzie GitHub Copilot wygeneruje zapytanie LINQ na podstawie wprowadzonych danych i domyślnie automatycznie je wykona. Aby potwierdzić, że zapytanie zostało pomyślnie wygenerowane i zastosowane, poszukaj zielonego znacznika wyboru, który wskazuje, że zapytanie LINQ wygenerowane przez narzędzie GitHub Copilot zostało w pełni wykonane i zastosowane.

### Przejdź do czatu GitHub Copilot
Funkcja zawiera również przycisk **Kontynuuj w czacie**, który znajdzie się w prawym górnym rogu pola tekstowego po wygenerowaniu co najmniej jednego zapytania LINQ przez GitHub Copilot. 

Kliknięcie tego przycisku spowoduje otwarcie dedykowanego okna czatu GitHub Copilot, w którym można uściślić zapytanie, zadać dodatkowe pytania lub dokładniej zapoznać się z alternatywnymi podejściami. Ta integracja zapewnia kontrolę i elastyczność podczas korzystania z pełnych możliwości narzędzia GitHub Copilot.

![Funkcja z możliwością edycji wyrażeń wbudowanych w GitHub Copilot](../media/editable-expression-copilot.png)

Gdy wszystko będzie gotowe do powrotu do wizualizatora, po prostu kliknij przycisk **Pokaż w wizualizatorze**. Dzięki temu można bezproblemowo przejść z powrotem do środowiska wizualizatora, w którym można wyświetlać lub stosować zmiany wygenerowane podczas sesji czatu.

Funkcja zapewnia płynny przepływ pracy między wizualizatorem a czatem w usłudze GitHub Copilot. Zaimplementowany czat jest zoptymalizowany pod kątem szybkich edycji i małych korekt, natomiast czat GitHub Copilot wyróżnia się obsługą bardziej szczegółowych i iteracyjnych ulepszeń, które mają na celu ułatwienie generowania zapytań LINQ na potrzeby łatwiejszego i bardziej wydajnego edytowania wyrażenia.

### Chcesz ją wypróbować?
Aktywuj darmową aplikację GitHub Copilot i odblokuj tę funkcję sztucznej inteligencji oraz wiele innych.
 Brak wersji próbnej. Brak karty kredytowej. Wystarczy twoje konto usługi GitHub. [Uzyskaj bezpłatnie Copilot](vscmd://View.GitHub.Copilot.Chat).
