---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: Personnaliser l’encodage de fichiers
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: Spécifiez l’encodage par défaut pour l’enregistrement de fichiers dans Visual Studio.
area: Productivity
featureId: DefaultFileEncoding

---


Les développeurs qui travaillent dans des environnements multiplateformes ont souvent besoin d’enregistrer des fichiers avec des encodages spécifiques. La modification de ces encodages peut entraîner différents problèmes.

Aujourd’hui, Visual Studio vous permet de définir l’encodage de fichier par défaut pour enregistrer des fichiers. Cette fonctionnalité garantit l’utilisation de votre encodage préféré dans la mesure du possible.

Pour définir l’encodage par défaut, accédez à **Outils > Options > Environnement > Documents**. Vous y trouverez une option intitulée **Enregistrer les fichiers avec un encodage spécifique**. Si cette option n’est pas cochée, Visual Studio gère l’encodage des fichiers en utilisant son comportement par défaut. Si cette option est cochée, Visual Studio utilise l’encodage spécifié dans la zone de liste déroulante adjacente chaque fois qu’un fichier est enregistré.

![Option d’encodage par défaut des fichiers dans Outils\Options](../media/default-file-encoding.png)

Si Visual Studio ne peut pas enregistrer avec l’encodage spécifié (par exemple, si vous demandez l’encodage *ASCII* pour un fichier contenant des caractères Unicode), l'application affiche une boîte de dialogue vous informant du problème.
