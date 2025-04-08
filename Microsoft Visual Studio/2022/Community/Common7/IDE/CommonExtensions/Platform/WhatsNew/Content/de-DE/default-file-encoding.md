---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: Anpassen der Dateicodierung
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: Geben Sie die Standardcodierung zum Speichern von Dateien in Visual Studio an.
area: Productivity
featureId: DefaultFileEncoding

---


Fachkräfte in der Entwicklung, die in plattformübergreifenden Umgebungen arbeiten, müssen Dateien häufig mit bestimmten Dateicodierungen speichern. Das Ändern dieser Codierungen kann zu verschiedenen Problemen führen.

In Visual Studio können Sie jetzt die Standarddateicodierung zum Speichern von Dateien festlegen. Dieses Feature stellt sicher, dass nach Möglichkeit Ihre bevorzugte Codierung verwendet wird.

Um die Standardcodierung festzulegen, navigieren Sie zu **Tools > Optionen > Umgebung > Dokumente**. Dort finden Sie eine Option namens **Dateien mit einer bestimmten Codierung speichern**. Wenn diese Option deaktiviert ist, verwaltet Visual Studio die Dateicodierung mit dem Standardverhalten. Ist sie aktiviert, verwendet Visual Studio beim Speichern einer Datei die im nebenstehenden Kombinationsfeld angegebene Codierung.

![Option für die Standardcodierung von Dateien in „Tools/Optionen“](../media/default-file-encoding.png)

Wenn Visual Studio eine Datei nicht mit der angegebenen Codierung speichern kann (z. B. wenn eine *ASCII*-Codierung für eine Datei mit Unicode-Zeichen angefordert wird), werden Sie in einem Dialogfeld über das Problem informiert.
