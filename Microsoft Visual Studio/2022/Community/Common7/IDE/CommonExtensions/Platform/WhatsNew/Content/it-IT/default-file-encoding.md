---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: Personalizzare la codifica dei file
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: Specificare la codifica predefinita per il salvataggio di file in Visual Studio.
area: Productivity
featureId: DefaultFileEncoding

---


Gli sviluppatori che lavorano in ambienti multipiattaforma spesso necessitano che i file vengano salvati con codifiche di file specifiche. L'uso di codifiche diverse può causare diversi problemi.

Visual Studio ora consente di impostare la codifica predefinita per il salvataggio dei file. Questa funzionalità assicura l'uso della codifica preferita ove possibile.

Per impostare la codifica predefinita, passare a **Strumenti > Opzioni > Ambiente > Documenti**. Qui è disponibile l'opzione **Salva file con codifica specifica**. Se questa opzione non è selezionata, Visual Studio gestirà la codifica dei file tramite il comportamento predefinito. Se è selezionata, Visual Studio userà la codifica specificata nella casella combinata adiacente ogni volta che si salva un file.

![Opzione di codifica dei file predefinita in Strumenti\Opzioni](../media/default-file-encoding.png)

Se Visual Studio non può salvare il file con la codifica specificata, ad esempio richiede la codifica *ASCII* per un file contenente caratteri Unicode), mostrerà una finestra di dialogo per segnalare il problema.
