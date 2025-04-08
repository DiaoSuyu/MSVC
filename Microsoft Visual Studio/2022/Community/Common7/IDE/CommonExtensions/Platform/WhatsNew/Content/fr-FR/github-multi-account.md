---
devComUrl: https://developercommunity.visualstudio.com/t/Multiple-github-user-accounts/10195369
thumbnailImage: ../media/github-active-badge.png
title: Gérer plusieurs comptes GitHub
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EfdJkRBfnmlHkCUlVgfrV_0BbA7B7ISqppWmOPkihdR1cw?e=MIBCab
description: Ajoutez plusieurs comptes GitHub et définissez un compte actif pour piloter les fonctionnalités de GitHub telles que GitHub Copilot et le contrôle de version.
area: IDE
featureId: GitHubMultiAccount

---


Avez-vous besoin d’utiliser des comptes GitHub distincts pour vos scénarios de développement ? Visual Studio vous permet désormais d’avoir plusieurs comptes GitHub en même temps !

### Ajout de plusieurs comptes GitHub
L’ajout de plusieurs comptes est facile ! Ouvrez simplement la carte de visite, sélectionnez **Ajouter un autre compte**, connectez-vous à votre compte GitHub, puis répétez l’opération selon les besoins.

![Carte de profil avec plusieurs comptes GitHub](../media/github-profilecard.png)

Vous pouvez également ajouter vos comptes à partir de la boîte de dialogue Paramètres du compte sous **Fichier > Paramètres du compte**.

### Définition d’un compte GitHub actif

Si vous ajoutez plusieurs comptes GitHub, Visual Studio utilise par défaut celui qui est marqué comme étant *actif* pour les fonctionnalités GitHub telles que la gestion de version et Copilot. 

Pour changer de compte actif, accédez aux options du compte et sélectionnez le bouton **Définir comme compte** actif.

![Définition du compte actif GitHub](../media/github-setasactive.png)


### Impact sur GitHub Copilot

Copilot s’active automatiquement quand le compte GitHub actif est abonné à GitHub Copilot pour les particuliers ou à GitHub Copilot pour les entreprises.

### Impact sur la gestion de version

Quand vous utilisez les demandes de tirage (pull requests) ou les problèmes GitHub, vous recevez une invite pour définir votre compte GitHub. Nous mémorisons vos préférences chaque fois que vous utilisez un dépôt particulier. Ainsi, quand vous changez de dépôt, vous n’avez pas à vous soucier du changement de compte pour vos opérations Git classiques telles que l’envoi (push), le tirage (pull) et la récupération (fetch). Vous êtes également invité à mettre à jour votre compte actif en cas de non-correspondance pour éviter d’utiliser le mauvais compte.

### Vous voulez essayer ?
Activez GitHub Copilot Gratuit et déverrouillez cette fonctionnalité d’IA parmi d’autres.
 Pas de version d’évaluation. Pas de carte de crédit. Juste votre compte GitHub. [Obtenez Copilot Gratuit](vscmd://View.GitHub.Copilot.Chat).
