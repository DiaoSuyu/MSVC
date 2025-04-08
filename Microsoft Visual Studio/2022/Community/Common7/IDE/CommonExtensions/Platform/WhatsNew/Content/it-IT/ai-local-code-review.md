---
restartRequired: true
featureFlagName: Git.UX.ReviewPullRequest
devComUrl: https://developercommunity.visualstudio.com/t/Use-Copilot-to-review-commit/10575248?q=code+review
thumbnailImage: ../media/17.13p2_local_code_review.png
title: Rilevare i problemi in fase di commit
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EWl1PdajOx1ImPgEUYMxF9QBeXLkJ5J7dHCA0rb_-b8uBQ?e=Z3zWG3
tags: top-story
description: Ottenere suggerimenti basati su GitHub Copilot per le modifiche al codice per individuare i potenziali problemi in anticipo e migliorare la qualità del codice.
area: Git tooling
surveyUrl: https://aka.ms/LocalCodeReview
featureId: ailocalcodereview

---


È ora possibile ottenere una revisione del codice di GitHub Copilot sulle modifiche locali prima di eseguire il commit. Con la sottoscrizione a Copilot abilitata in Visual Studio e i flag funzionalità seguenti abilitati, è possibile visualizzare il nuovo pulsante di commento luminoso nella finestra Modifiche Git. Quando si fa clic, Copilot esamina i set di modifiche e propone alcuni suggerimenti inline nell'editor.

![17.13P2 - Pulsante Local Code Review](../media/17.13p2_local_code_review-button.png)

Il modello può segnalare problemi critici, ad esempio potenziali problemi di prestazioni e sicurezza. Rilevandoli in anticipo, si riduce il rischio di propagarli nella codebase remota.

![Commento di revisione del codice locale](../media/17.13p2_local_code_review.png)

Assicurarsi che siano abilitati entrambi i flag funzionalità seguenti:

- **Strumenti** > **Opzioni** > **Funzionalità di anteprima** > **Commenti della richiesta pull**
- **Strumenti** > **Opzioni** > **GitHub** > **Copilot** > **Integrazione del controllo del codice sorgente** > **Abilita funzionalità di anteprima Git**.

### È possibile provare.
Attivare la versione gratuita di GitHub Copilot e sbloccare questa e altre funzionalità basate sull'intelligenza artificiale.
 Nessuna versione di valutazione. Nessuna carta di credito. Basta l'account GitHub. [Scaricare la versione gratuita di Copilot](vscmd://View.GitHub.Copilot.Chat).
