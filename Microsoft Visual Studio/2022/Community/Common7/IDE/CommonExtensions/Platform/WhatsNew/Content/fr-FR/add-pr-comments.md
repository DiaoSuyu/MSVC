---
tags: top-story
featureFlagName: Git.UX.ReviewPullRequestAddComment
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdF1b2Q6ENlPtBi9sTug6CkBTewteQ9kiMuHpprvsaqmcw?e=Cr8rXF
thumbnailImage: ../media/17.13p1-add-pull-request-comments-thumbnail.png
title: Ajouter des commentaires sur les pull requests
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-171-Git-Pull-Request-is-gone/1576559
surveyUrl: https://aka.ms/reviewPR
description: Réviser les requêtes pull dans Visual Studio en ajoutant de nouveaux commentaires aux fichiers de la branche vérifiée.
area: Git tooling
featureId: addprcomments

---


Avec la dernière mise à jour, il est maintenant possible d’ajouter de nouveaux commentaires aux fichiers de la pull request sur la branche extraite. Cette fonctionnalité était très demandée pour l’expérience des pull requests et constitue la dernière d’une série d’améliorations dans Visual Studio.

### Mise en route

Activez les indicateurs de fonctionnalités **Commentaires sur les pull requests** et **Ajouter un commentaire sur les pull requests**, extrayez une branche ayant une branche de pull request active et sélectionnez **Afficher les commentaires dans les fichiers** dans l’InfoBar. Cela activera l’expérience des commentaires sur les pull requests dans l’éditeur.

![Afficher la notification des commentaires de demande de tirage (pull request)](../media/17.11p1-view-pull-request-comments-thumbnail.png)

Pour ajouter un nouveau commentaire à un fichier, sélectionnez l’icône **Ajouter un commentaire** dans la marge, ou faites un clic droit sur la ligne où vous souhaitez ajouter un commentaire, puis choisissez **Git > Ajouter un commentaire** dans le menu contextuel.

![Icône pour ajouter un commentaire sur une pull request](../media/17.13p1-add-pull-request-comments-thumbnail.png)

Remarque : l'icône ne s'affichera que dans les fichiers qui font partie de la requête pull. Pour les pull requests GitHub, vous ne pourrez commenter que les lignes entourant et incluant les lignes qui ont été modifiées.
