---
devComUrl: https://github.com/dotnet/razor/issues/6187
thumbnailImage: ../media/extract-to-razor-component-thumbnail.png
title: Extrahieren von HTML zu Razor-Komponente
description: Extrahieren Sie HTML-Code mühelos über eine Codeaktion in eine Razor-Komponente in Visual Studio.
area: Web
featureId: extract-to-razor-component-html

---


Haben Sie jemals gefunden, dass Sie zu viel Code zu einer *.razor-Datei* hinzufügen und wollten eine einfache Möglichkeit, sie in ihre eigene wiederverwendbare Komponente zu verschieben? Wenn Sie mit HTML in einer Razor-Datei arbeiten, können Sie jetzt `CTRL+.` verwenden oder mit der rechten Maustaste klicken und **Schnellaktionen und Refactorings** auswählen, um Ihre ausgewählte HTML-Auszeichnung automatisch in eine neue Razor-Komponente in Visual Studio zu extrahieren.

In dieser ersten Iteration wird das Feature *Element in neue Komponente extrahieren* nur mit HTML-Markupauswahlen unterstützt. 

![Beispiel für HTML-Markup, das in eine neue Razor-Komponente extrahiert wird](../media/extract-to-razor-component.png)

Diese Erweiterung ermöglicht Ihnen das mühelose Modularisieren Ihrer Razor-Komponenten und optimiert so Ihren Workflow.
