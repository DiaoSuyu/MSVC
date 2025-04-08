---
devComUrl: https://developercommunity.visualstudio.com/t/fix-scroll-bars/1087969
thumbnailImage: ../media/horizontal-scroll-bar-thumbnail.png
title: Réimaginer la barre de défilement horizontale
description: La barre de défilement horizontale de l'éditeur se repositionne désormais pour être toujours accessible, même lorsque l'espace est limité.
area: Productivity
featureId: EditorHorizontalScrollbarPersistence

---


Le plateau de l’éditeur dans Visual Studio est un espace précieux contenant une multitude d’informations. Vous pouvez contrôler le zoom, vérifier l’état de votre document, voir sur quelle ligne vous vous trouvez et accéder à toutes sortes d'informations.

Malheureusement, cet espace est parfois tellement encombré que la barre de défilement horizontale devient difficile à utiliser. Cela est d’autant plus le cas dans une vue côte à côte où le plateau est peu large.

Avec cette dernière mise à jour, ces difficultés sont résolues. Si la barre de défilement devient trop étroite, elle se positionnera au-dessus du plateau de l’éditeur pour rester accessible. Par défaut, elle reviendra dans le plateau de l’éditeur dès que l’espace disponible sera suffisant.

![La barre de défilement horizontale, affichée au-dessus du plateau de l’éditeur](../media/horizontal-scroll-bar-thumbnail.png)

Nous pensons que ce comportement sera idéal pour la plupart des utilisateurs, mais si vous rencontrez néanmoins des problèmes, vous pouvez le contrôler dans **Outils > Options**. L’option se trouve sous **Éditeur de texte > Avancé** et indique **Emplacement de la barre de défilement horizontale de l’éditeur**. Ce paramètre vous permet de choisir si la barre de défilement doit ajuster sa position selon l’espace disponible, rester dans le plateau de l’éditeur ou apparaître systématiquement au-dessus du plateau.

![Paramètre de la barre de défilement horizontale](../media/horizontal-scroll-bar-setting.png)
