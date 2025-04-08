---
restartRequired: true
featureFlagName: Shell.ThemeAgnosticFontSettings
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: Conserver les préférences en matière de polices de caractères pour tous les thèmes
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: Si vous changez de thème, vos préférences en matière de police et de taille de police seront conservées.
area: IDE
featureId: preserveFontAcrossThemes

---


Nous comprenons que les polices que les développeurs choisissent lorsqu’ils codent sont un choix personnel, influencé par des préférences en matière de lisibilité, d’accessibilité ou d’esthétique. Les thèmes de Visual Studio se concentrent principalement sur les couleurs de présentation et sont indépendants des polices préférées.

Avec cette mise à jour, nous avons introduit une fonctionnalité qui conserve vos choix de police et de taille lorsque vous changez de thème. Vous pouvez maintenant définir vos préférences de police une fois et changer de thème dans Visual Studio sans avoir à reconfigurer vos paramètres de police à chaque fois. Notez que les couleurs de vos polices restent liées au thème, car c’est l’objectif des thèmes, mais vos sélections de police seront préservées.

![L’éditeur Visual Studio montrant le même morceau de code utilisant la même police, mais une moitié du code est en thème sombre et l’autre en thème clair.](../media/FontAttributesPreserveAcrossThemes.png)

Cette fonctionnalité sera activée par défaut pour tous les utilisateurs. Si vous préférez l’ancien comportement, allez dans [Outils > Gérer les fonctionnalités](vscmd://Tools.ManagePreviewFeatures) Preview et trouvez l’option **Séparer les paramètres de police de la sélection de thème de couleur**. Si cette option est cochée, vos préférences de police seront conservées indépendamment des changements de thème. Décochez la case pour rétablir l’ancien comportement qui lie les choix de police au thème.
