---
restartRequired: true
featureFlagName: Shell.ThemeAgnosticFontSettings
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: Beibehalten von Schriftarteinstellungen für Designs
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: Beim Ändern von Themen bleiben Ihre Einstellungen für Schriftart und Schriftgröße nun erhalten.
area: IDE
featureId: preserveFontAcrossThemes

---


Wir wissen, dass die Schriftarten, die Entwickler bei der Codierung auswählen, eine persönliche Wahl ist, die von den Vorlieben für Lesbarkeit, Barrierefreiheit oder Ästhetik beeinflusst wird. Visual Studio-Designs konzentrieren sich in erster Linie auf Präsentationsfarben und sind unabhängig von Ihren bevorzugten Schriftarten.

Mit diesem Update haben wir Funktionen eingeführt, um beim Wechseln von Designs Ihre Schriftart- und Schriftgradauswahl beizubehalten. Sie können ihre Schriftarteinstellungen jetzt einmal festlegen und Designs in Visual Studio wechseln, ohne ihre Schriftarteinstellungen jedes Mal neu konfigurieren zu müssen. Beachten Sie, dass die Farben Ihrer Schriftarten mit dem Design verknüpft bleiben, da dies der Zweck von Designs ist, ihre Schriftartauswahl jedoch beibehalten wird.

![Der Visual Studio-Editor, der denselben Codeabschnitt mit derselben Schriftart anzeigt, die Hälfte des Codes befindet sich jedoch im dunklen Design und in der Hälfte hell.](../media/FontAttributesPreserveAcrossThemes.png)

Diese Funktion ist standardmäßig für alle Benutzer aktiviert. Wenn Sie das vorherige Verhalten bevorzugen, wechseln Sie zu [Tools > Verwalten von Vorschaufeatures](vscmd://Tools.ManagePreviewFeatures) und suchen Sie die Option **Schriftarteinstellungen von der Farbdesignauswahl trennen**. Wenn diese Option aktiviert ist, werden Ihre Schriftarteinstellungen unabhängig von Designänderungen beibehalten. Deaktivieren Sie das Kontrollkästchen, um das vorherige Verhalten wieder aufzuheben, mit dem Schriftartenauswahlen-Designs verknüpft werden.
