---
restartRequired: true
featureFlagName: Git.UX.ReviewPullRequest
devComUrl: https://developercommunity.visualstudio.com/t/Use-Copilot-to-review-commit/10575248?q=code+review
thumbnailImage: ../media/17.13p2_local_code_review.png
title: Probleme zum Commit-Zeitpunkt erkennen
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EWl1PdajOx1ImPgEUYMxF9QBeXLkJ5J7dHCA0rb_-b8uBQ?e=Z3zWG3
tags: top-story
description: Holen Sie sich GitHub Copilot-gestützte Vorschläge für Ihre Codeänderungen, um potenzielle Probleme frühzeitig zu erkennen und die Codequalität zu verbessern.
area: Git tooling
surveyUrl: https://aka.ms/LocalCodeReview
featureId: ailocalcodereview

---


Jetzt können Sie eine GitHub Copilot-Codeüberprüfung zu Ihren lokalen Änderungen erhalten bevor Sie einen Commit ausführen! Wenn Ihr Copilot-Abonnement in Visual Studio aktiviert ist und die folgenden Feature-Flags aktiviert sind, können Sie die neue Sparkle-Kommentarschaltfläche im Fenster „Git-Änderungen“ sehen. Wenn Sie geklickt haben, überprüft Copilot Ihre Änderungen und schlägt einige Vorschläge direkt in Ihrem Editor vor.

![17.13P2 Schaltfläche „Lokale Codeüberprüfung”](../media/17.13p2_local_code_review-button.png)

Das Modell kann auf kritische Probleme hinweisen, z. B. potenzielle Leistungs- und Sicherheitsprobleme. Die frühzeitige Erkennung solcher Probleme reduziert das Risiko, dass Probleme in Ihre Remotecodebasis gepusht werden.

![Kommentar zur lokalen Codeüberprüfung](../media/17.13p2_local_code_review.png)

Stellen Sie sicher, dass Sie beide der folgenden Feature-Flags aktiviert haben:

- **Tools** > **Optionen** > **Preview-Features** > **Pull Request-Kommentare**
- **Tools** > **Optionen** > **GitHub** > **Copilot** > **Integration der Quellcodeverwaltung** > **Git-Previewfunktionen aktivieren**.

### Möchten Sie es selbst ausprobieren?
Aktivieren Sie GitHub Copilot Free, und nutzen Sie dieses und viele weitere KI-Features.
 Keine Testversion. Keine Kreditkarte Sie benötigen nur Ihr GitHub-Konto. [Laden Sie Copilot Free herunter](vscmd://View.GitHub.Copilot.Chat).
