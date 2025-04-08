---
devComUrl: https://github.com/dotnet/razor/issues/6187
thumbnailImage: ../media/extract-to-razor-component-thumbnail.png
title: Estrarre codice HTML nel componente Razor
description: Usare un'azione del codice per estrarre facilmente codice HTML in un componente Razor in Visual Studio.
area: Web
featureId: extract-to-razor-component-html

---


A chi non è mai capitato di aggiungere troppo codice a un file con estensione *razor* e voler un modo semplice per spostarlo nel suo componente riutilizzabile? Quando si usa codice HTML in un file Razor, è ora possibile usare `CTRL+.` o fare clic con il pulsante destro del mouse e selezionare **Azioni rapide e refactoring** per estrarre automaticamente il markup HTML selezionato in un nuovo componente Razor in Visual Studio.

In questa prima iterazione, la funzionalità *Estrai elemento in un nuovo componente* è supportata solo con le selezioni del markup HTML. 

![Esempio di markup HTML estratto in un nuovo componente Razor](../media/extract-to-razor-component.png)

Questo miglioramento semplifica il flusso di lavoro permettendo di modularizzare senza difficoltà i componenti Razor.
