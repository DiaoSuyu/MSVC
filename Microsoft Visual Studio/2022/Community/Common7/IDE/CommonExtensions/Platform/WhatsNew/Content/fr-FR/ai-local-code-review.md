---
restartRequired: true
featureFlagName: Git.UX.ReviewPullRequest
devComUrl: https://developercommunity.visualstudio.com/t/Use-Copilot-to-review-commit/10575248?q=code+review
thumbnailImage: ../media/17.13p2_local_code_review.png
title: Détecter les problèmes lors du commit
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EWl1PdajOx1ImPgEUYMxF9QBeXLkJ5J7dHCA0rb_-b8uBQ?e=Z3zWG3
tags: top-story
description: Obtenez des suggestions alimentées par GitHub Copilot pour vos modifications de code afin de vous aider à détecter les problèmes potentiels tôt et améliorer la qualité de votre code.
area: Git tooling
surveyUrl: https://aka.ms/LocalCodeReview
featureId: ailocalcodereview

---


Désormais, vous pouvez obtenir une revue de code GitHub Copilot sur vos modifications locales avant même de les committer ! Avec votre abonnement Copilot activé dans Visual Studio et les drapeaux de fonctionnalités suivants activés, vous pouvez voir le nouveau bouton de commentaire étincelant dans la fenêtre des modifications Git. Lorsque vous cliquez dessus, Copilot examinera vos ensembles de modifications et proposera des suggestions directement dans votre éditeur.

![Bouton de revue de code local 17.13P2](../media/17.13p2_local_code_review-button.png)

Le modèle peut signaler des problèmes critiques tels que des problèmes potentiels de performance et de sécurité qui, lorsqu’ils sont détectés tôt, aident à réduire votre risque de pousser des problèmes dans votre base de code distante.

![Commentaire de revue de code local](../media/17.13p2_local_code_review.png)

Assurez-vous d’avoir activé les deux drapeaux de fonctionnalités suivants :

- **Outils** > **Options** > **Fonctionnalités d’aperçu** > **Commentaires de pull request**
- **Outils** > **Options** > **GitHub** > **Copilot** > **Intégration de contrôle de source** > **Activer les fonctionnalités d’aperçu Git**.

### Vous voulez essayer ?
Activez GitHub Copilot Gratuit et déverrouillez cette fonctionnalité d’IA parmi d’autres.
 Pas de version d’évaluation. Pas de carte de crédit. Juste votre compte GitHub. [Obtenez Copilot Gratuit](vscmd://View.GitHub.Copilot.Chat).
