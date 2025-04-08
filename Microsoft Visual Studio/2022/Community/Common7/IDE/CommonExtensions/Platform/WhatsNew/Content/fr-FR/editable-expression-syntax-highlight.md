---
devComUrl: 
thumbnailImage: ../media/editable-expression-syntax-highlight-thumbnail.png
title: Mise en évidence de la syntaxe avec le visualisateur IEnumerable
specUrl: https://devdiv.visualstudio.com/DevDiv/_workitems/edit/2253294
description: Une expression éditable améliorée avec mise en évidence de la syntaxe est désormais disponible.
area: Debugging & diagnostics
featureId: editable-expression-syntax-highlight

---


Écrire des expressions LINQ peut devenir complexe, surtout lorsqu'elles prennent de l'ampleur. Visual Studio 2022 introduit désormais la **coloration syntaxique** dans **l'expression modifiable du visualiseur IEnumerable**.

La coloration syntaxique applique différentes couleurs à des parties spécifiques de vos requêtes, telles que les classes, énumérations, délégués, structures et mots-clés. Cela simplifie l’identification des différents composants de vos expressions LINQ et permet de visualiser d’un coup d’œil le flux logique, rendant le code plus clair et plus facile à maintenir.

![Coloration syntaxique du visualiseur IEnumerable](../media/editable-expression-syntax-highlighting.png)

### Personnaliser la coloration syntaxique

Visual Studio vous permet de personnaliser le schéma de couleurs selon vos préférences. Pour personnaliser vos couleurs :

1. Rendez-vous dans **Outils > Options > Environnement > Polices et couleurs**.
2. Sélectionnez **Éditeur de texte** dans le menu déroulant **Afficher les paramètres pour **.
3. Ajustez la couleur de chaque élément **Types utilisateur** pour correspondre à votre style de codage.
