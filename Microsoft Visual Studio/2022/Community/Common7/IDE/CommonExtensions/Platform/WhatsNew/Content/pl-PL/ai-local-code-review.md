---
restartRequired: true
featureFlagName: Git.UX.ReviewPullRequest
devComUrl: https://developercommunity.visualstudio.com/t/Use-Copilot-to-review-commit/10575248?q=code+review
thumbnailImage: ../media/17.13p2_local_code_review.png
title: Wyłapywanie błędów w momencie zatwierdzenia
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EWl1PdajOx1ImPgEUYMxF9QBeXLkJ5J7dHCA0rb_-b8uBQ?e=Z3zWG3
tags: top-story
description: Uzyskaj sugestie dotyczące zmian w kodzie oparte na GitHub Copilot, które pomogą Ci wcześnie wychwycić potencjalne błędy i poprawić jakość kodu.
area: Git tooling
surveyUrl: https://aka.ms/LocalCodeReview
featureId: ailocalcodereview

---


Teraz możesz uzyskać recenzję kodu GitHub Copilot dla swoich lokalnych zmian jeszcze przed ich zatwierdzeniem! Po włączeniu subskrypcji Copilot w Visual Studio i włączeniu następujących flag funkcji, w oknie zmian Git można zobaczyć nowy przycisk komentarza sparkle. Po kliknięciu Copilot przeanalizuje zestawy zmian i zaproponuje kilka sugestii w edytorze.

![Przycisk przeglądu kodu lokalnego 17.13P2](../media/17.13p2_local_code_review-button.png)

Model może wskazać krytyczne kwestie, takie jak potencjalne problemy z wydajnością i bezpieczeństwem, których wczesne wykrycie pomaga zmniejszyć ryzyko przeniesienia problemów do zdalnej bazy kodu.

![Komentarz do lokalnej recenzji kodu](../media/17.13p2_local_code_review.png)

Upewnij się, że masz włączone obie poniższe flagi funkcji:

- **Narzędzia** > **Opcje** > **Podgląd funkcji** > **Komentarze żądania ściągnięcia**
- **Narzędzia** > **Opcje** > **GitHub** > **Copilot** > **Integracja kontroli źródła** > **Włącz funkcje podglądu Git**.

### Chcesz ją wypróbować?
Aktywuj darmową aplikację GitHub Copilot i odblokuj tę funkcję sztucznej inteligencji oraz wiele innych.
 Brak wersji próbnej. Brak karty kredytowej. Wystarczy twoje konto usługi GitHub. [Uzyskaj bezpłatnie Copilot](vscmd://View.GitHub.Copilot.Chat).
