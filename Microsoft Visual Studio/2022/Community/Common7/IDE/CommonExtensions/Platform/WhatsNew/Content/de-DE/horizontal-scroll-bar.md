---
devComUrl: https://developercommunity.visualstudio.com/t/fix-scroll-bars/1087969
thumbnailImage: ../media/horizontal-scroll-bar-thumbnail.png
title: Neugestalten der horizontalen Bildlaufleiste
description: Die horizontale Bildlaufleiste im Editor ändert ihre Position jetzt selbst, damit sie immer zugänglich ist, auch wenn nur wenig Platz verfügbar ist.
area: Productivity
featureId: EditorHorizontalScrollbarPersistence

---


Die Editor-Taskleiste in Visual Studio bietet viele wertvolle Informationen. Sie können die Ansicht vergrößern oder verkleinern, die Integrität Ihres Dokuments überprüfen, feststellen, in welcher Zeile Sie sich gerade befinden, und viele zusätzliche Informationen anzeigen.

Dieser Bereich ist manchmal leider so überfüllt, dass die horizontale Bildlaufleiste nur schwer zugänglich ist. Dies ist insbesondere bei einer Side-by-Side-Ansicht der Fall, bei der die Taskleiste ziemlich schmal ist.

Mit dem aktuellen Update gehören diese Probleme der Vergangenheit an. Wenn die Bildlaufleiste zu schmal wird, positioniert sie sich über dem Infobereich, um zugänglich zu bleiben. Sobald wieder ausreichend Platz vorhanden ist, wird sie standardmäßig erneut in der Editor-Taskleiste angezeigt.

![Die horizontale Bildlaufleiste, die über der Editor-Taskleiste angezeigt wird](../media/horizontal-scroll-bar-thumbnail.png)

Obwohl wir glauben, dass dieses Verhalten für die meisten Benutzer ideal ist, können Sie es unter **Tools > Optionen** ändern, falls Probleme auftreten. Die Option ist unter **Text-Editor > Erweitert** zu finden und heißt **Position der horizontalen Bildlaufleiste des Editors**. Mit dieser Einstellung können Sie festlegen, ob die Bildlaufleiste ihre Position entsprechend dem verfügbaren Platz anpasst, weiterhin in der Editor-Taskleiste angezeigt wird oder immer über der Editor-Taskleiste platziert wird.

![Einstellung der horizontalen Bildlaufleiste.](../media/horizontal-scroll-bar-setting.png)
