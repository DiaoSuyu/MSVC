---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/Integrated-Linq-Editor/442398
thumbnailImage: ../media/editable-expression-copilot-thumbnail.png
title: Creare query LINQ complesse
specUrl: https://microsoft.sharepoint.com/:p:/t/VisualStudioProductTeam/ETycaBw7iJdFhgYRYWGSa34BXJEaakZ2PCrAWHmhkEbAsA?e=7hIYoO
description: Espressione modificabile migliorata con la chat inline di GitHub Copilot direttamente nel visualizzatore IEnumerable.
area: Debugging & diagnostics
featureId: editable-expression-inline-copilot

---


Il visualizzatore IEnumerable ora include la chat inline per la sua espressione modificabile, che consente agli utenti di sfruttare l'intelligenza artificiale direttamente all'interno del visualizzatore IEnumerable per creare query LINQ complesse per l'espressione modificabile. 

![Chat inline del visualizzatore IEnumerable](../media/editable-expression-inline-copilot.mp4)

### Chat inline dell'espressione modificabile

Per visualizzare la chat inline, è sufficiente fare clic sul pulsante luminoso GitHub Copilot situato nell'angolo in basso a destra della casella di testo dell'espressione modificabile. Verrà aperta una casella di testo sopra l'espressione modificabile originale, con la richiesta di *descrivere come si desidera perfezionare l'espressione corrente*. Immettere la richiesta in linguaggio naturale e, una volta pronti, fare clic sul **pulsante Invia**.

GitHub Copilot genererà una query LINQ in base all'input e la eseguirà automaticamente per impostazione predefinita. Per verificare che la query sia stata generata e applicata correttamente, cercare il segno di spunta verde, che indica che la query LINQ generata da GitHub Copilot è stata eseguita e applicata completamente.

### Continua nella chat di GitHub Copilot
La funzionalità include anche un pulsante **Continua nella chat** dopo che almeno una query LINQ è stata generata da GitHub Copilot, posto nell'angolo in alto a destra della casella di testo. 

Facendo clic su questo pulsante si apre una finestra dedicata di chat di GitHub Copilot in cui è possibile perfezionare la query, porre domande di follow-up o esplorare approcci alternativi in modo più dettagliato. Questa integrazione consente di mantenere il controllo e la flessibilità sfruttando al contempo le funzionalità complete di GitHub Copilot.

![Espressione modificabile inline GitHub Copilot](../media/editable-expression-copilot.png)

Quando si è pronti per tornare al visualizzatore, è sufficiente fare clic sul pulsante **Mostra nel visualizzatore** . Ciò consente di tornare facilmente all'ambiente del visualizzatore, in cui è possibile visualizzare o applicare le modifiche generate durante la sessione di chat.

Questa funzionalità fornisce un flusso di lavoro fluido tra il visualizzatore e GitHub Copilot Chat. La chat inline è ottimizzata per modifiche rapide e piccole rettifiche, mentre GitHub Copilot Chat è migliore nella gestione di miglioramenti più dettagliati e iterativi, ma entrambe hanno lo scopo di semplificare e rendere più efficiente la generazione di query LINQ per l'espressione modificabile.

### È possibile provare.
Attivare la versione gratuita di GitHub Copilot e sbloccare questa e altre funzionalità basate sull'intelligenza artificiale.
 Nessuna versione di valutazione. Nessuna carta di credito. Basta l'account GitHub. [Scaricare la versione gratuita di Copilot](vscmd://View.GitHub.Copilot.Chat).
