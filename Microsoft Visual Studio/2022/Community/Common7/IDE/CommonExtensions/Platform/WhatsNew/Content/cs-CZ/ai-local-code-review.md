---
restartRequired: true
featureFlagName: Git.UX.ReviewPullRequest
devComUrl: https://developercommunity.visualstudio.com/t/Use-Copilot-to-review-commit/10575248?q=code+review
thumbnailImage: ../media/17.13p2_local_code_review.png
title: Zachycení problémů během potvrzování
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EWl1PdajOx1ImPgEUYMxF9QBeXLkJ5J7dHCA0rb_-b8uBQ?e=Z3zWG3
tags: top-story
description: Funkce GitHub Copilot nabízí návrhy změn kódu, které pomáhají včas zachytit potenciální problémy a zlepšit kvalitu kódu.
area: Git tooling
surveyUrl: https://aka.ms/LocalCodeReview
featureId: ailocalcodereview

---


Nyní můžete nechat kód zkontrolovat funkcí GitHub Copilot po místních změnách ještě před potvrzením. S povoleným předplatným funkce Copilot v sadě Visual Studio a následujícími příznaky funkcí uvidíte v okně změn Git nové tlačítko komentáře s jiskrou. Po kliknutí Copilot prověří změny a přímo v editoru nabídne určitá doporučení.

![17.13P2 Tlačítko místní kontroly kódu](../media/17.13p2_local_code_review-button.png)

Model může upozornit na kritické problémy, například na potenciální problémy související s výkonem a zabezpečením, jejichž včasné zachycení pomáhá snížit rizika jejich přenosu do vzdáleného základu kódu.

![Komentář místní kontroly kódu](../media/17.13p2_local_code_review.png)

Zkontrolujte, zda máte povolené oba následující příznaky funkcí:

- **Nástroje** > **Možnosti** > **Funkce Preview** > **Žádost o přijetí změn – komentáře**
- **Nástroje** > **Možnosti** > **GitHub** > **Copilot** > **Integrace správy zdrojového kódu** > **Povolit funkce Git Preview**.

### Chcete to vyzkoušet?
Aktivujte nástroj GitHub Copilot Free a odemkněte tuto funkci využívající umělou inteligenci a mnoho dalších.
 Žádná zkušební verze. Žádná platební karta. Jen váš účet GitHub. [Získejte nástroj Copilot Free](vscmd://View.GitHub.Copilot.Chat).
