---
devComUrl: https://developercommunity.visualstudio.com/t/Support-Filenamelinecolumn-format-in/10720994
thumbnailImage: ../media/code-search-go-to-line-parentheses-thumbnail.png
title: Navigation de ligne et de colonne améliorée
description: Visual Studio prend désormais en charge la navigation de ligne et de colonne avancée dans Code Search.
area: Productivity
featureId: AllInOneSearchLineNavigationNewFormatSupport

---


Dans [Code Search](vscmd://Edit.NavigateTo), nous avons considérablement amélioré les fonctionnalités de navigation de ligne. Les formats suivants sont maintenant pris en charge :

- `:line` pour naviguer vers une ligne spécifique dans le document actif
- `:line,col` pour naviguer vers une ligne et une colonne spécifiques dans le document actif
- `file:line` pour naviguer vers une ligne spécifique d’un fichier donné
- `file:line,col` pour naviguer vers une ligne et une colonne spécifiques d’un fichier donné
- `file(line)` pour naviguer vers une ligne spécifique d’un fichier donné
- `file(line,col)` pour naviguer vers une ligne et une colonne spécifiques d’un fichier donné

![Exemple montrant la navigation vers un fichier, une ligne et une colonne](../media/code-search-go-to-line-parentheses.png)

Ces améliorations accélèrent la localisation et la modification du code, ce qui améliore votre productivité et simplifie votre workflow.
