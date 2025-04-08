---
devComUrl: https://github.com/microsoft/DockerTools/issues/359
thumbnailImage: ../media/docker.png
title: Ajouter une échelle à Docker Compose
description: La propriété de mise à l’échelle dans Docker Compose est désormais prise en charge.
area: Cloud
featureId: dockercomposescale

---


Vous pouvez maintenant ajouter la propriété `scale` à votre configuration de service Docker Compose pour déboguer avec un nombre spécifique de réplicas en cours d’exécution. Par exemple, la configuration ci-dessous exécutera deux instances du service `webapi` lors du lancement.

![Échelle Docker](../media/docker-scale.png)

Cette amélioration permet des tests de charge et un débogage plus efficaces de vos applications en simulant un environnement similaire à la production. Elle rationalise également votre flux de travail en facilitant la gestion de multiples instances directement à partir de votre fichier Compose. Cette fonctionnalité est particulièrement utile pour tester le comportement de vos services sous charge et vous assurer que votre application peut gérer plusieurs instances en toute transparence.
