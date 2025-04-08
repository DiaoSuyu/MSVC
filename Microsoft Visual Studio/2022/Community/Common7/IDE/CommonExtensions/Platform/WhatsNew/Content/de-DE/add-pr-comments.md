---
tags: top-story
featureFlagName: Git.UX.ReviewPullRequestAddComment
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdF1b2Q6ENlPtBi9sTug6CkBTewteQ9kiMuHpprvsaqmcw?e=Cr8rXF
thumbnailImage: ../media/17.13p1-add-pull-request-comments-thumbnail.png
title: Hinzufügen von Kommentaren zu Pull Requests
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-171-Git-Pull-Request-is-gone/1576559
surveyUrl: https://aka.ms/reviewPR
description: Überprüfen Sie Pull Requests in Visual Studio, indem Sie den Pull Request-Dateien im ausgecheckten Branch neue Kommentare hinzufügen.
area: Git tooling
featureId: addprcomments

---


Das aktuelle Update ermöglicht es Ihnen, den Pull Request-Dateien im ausgecheckten Branch neue Kommentare hinzuzufügen. Diese Funktion wurde im Zusammenhang mit der Pull-Request-Erfahrung stark angefordert und stellt die letzte Verbesserung in der Serie der Verbesserungen in Visual Studio dar.

### Erste Schritte

Aktivieren Sie die Feature-Flags **Pull Request Comments** und **Pull Request Add Comment**, checken Sie einen beliebigen Branch mit einem aktiven Pull Request aus, und wählen Sie in der Infoleiste **Kommentare in Dateien anzeigen** aus. Dadurch wird im Editor die Option „Pull Request-Kommentare“ aktiviert.

![Benachrichtigung für die Anzeige von Pull Request-Kommentaren](../media/17.11p1-view-pull-request-comments-thumbnail.png)

Wenn Sie einer Datei einen neuen Kommentar hinzufügen möchten, wählen Sie am Rand das Symbol **Kommentar hinzufügen** aus, oder klicken Sie mit der rechten Maustaste auf die Zeile, zu der Sie einen Kommentar hinzufügen möchten, und wählen Sie im Kontextmenü **Git > Kommentar hinzufügen** aus.

![Symbol für das Hinzufügen eines Kommentars zum Pull Request](../media/17.13p1-add-pull-request-comments-thumbnail.png)

Hinweis: Das Symbol wird nur in Dateien angezeigt, die Teil des Pull Requests sind. Bei GitHub-Pull Requests können Sie nur den geänderten Zeilen oder Zeilen, die diese umgeben, Kommentare hinzufügen.
