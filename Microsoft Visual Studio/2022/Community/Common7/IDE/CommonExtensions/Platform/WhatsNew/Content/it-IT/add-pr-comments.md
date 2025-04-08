---
tags: top-story
featureFlagName: Git.UX.ReviewPullRequestAddComment
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdF1b2Q6ENlPtBi9sTug6CkBTewteQ9kiMuHpprvsaqmcw?e=Cr8rXF
thumbnailImage: ../media/17.13p1-add-pull-request-comments-thumbnail.png
title: Aggiungere commenti nelle richieste pull
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-171-Git-Pull-Request-is-gone/1576559
surveyUrl: https://aka.ms/reviewPR
description: Esaminare le richieste pull in Visual Studio aggiungendo nuovi commenti ai file nel ramo estratto.
area: Git tooling
featureId: addprcomments

---


Con l'aggiornamento più recente, è ora possibile aggiungere nuovi commenti ai file delle richieste pull nel ramo estratto. Si tratta di una richiesta principale per l'esperienza di richiesta pull ed è la più recente di una serie di miglioramenti apportati all'esperienza di richiesta pull in Visual Studio.

### Operazioni preliminari

Abilitare i flag funzionalità **Commenti della richiesta pull** e **Commenti aggiunti alla richiesta pull**, estrarre eventuali rami con una richiesta pull attiva e selezionare **Mostra commenti nei file** nella barra informazioni. Verrà attivata l'esperienza dei commenti delle richieste pull nell'editor.

![Visualizzare la notifica dei commenti delle richieste pull](../media/17.11p1-view-pull-request-comments-thumbnail.png)

Per aggiungere un nuovo commento a un file, fare clic sull'icona **Aggiungi commento** nel margine oppure fare clic con il pulsante destro del mouse sulla riga su cui si desidera aggiungere un commento, quindi scegliere **Git > Aggiungi commento** dal menu di scelta rapida.

![Icona Aggiungere un commento nella richiesta pull](../media/17.13p1-add-pull-request-comments-thumbnail.png)

Nota: l'icona verrà visualizzata solo nei file che fanno parte della richiesta pull. Per le richieste pull di GitHub, sarà possibile aggiungere commenti solo sulle righe circostanti e che includono le righe modificate.
