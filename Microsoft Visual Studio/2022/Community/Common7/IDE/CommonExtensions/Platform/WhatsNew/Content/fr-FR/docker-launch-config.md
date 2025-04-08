---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: Lancer une nouvelle configuration Docker
description: Activer le support depends_on avec l’option de configuration de lancement DependencyAwareStart.
area: Cloud
featureId: dockerlaunchconfig

---


Nous sommes heureux d’introduire une nouvelle option de configuration de lancement appelée `DependencyAwareStart`. Lorsque cette option est définie sur `True`, elle modifie la façon dont les projets Docker Compose sont lancés en activant l’utilisation de la directive `depends_on` dans votre configuration Compose.

![Dépendances Docker](../media/docker-depends_on.png)

Cette fonctionnalité garantit que les conteneurs spécifiés sont démarrés dans le bon ordre, en respectant les exigences de dépendance définies dans votre fichier Docker Compose. En gérant les dépendances de manière plus efficace, elle améliore la robustesse et la fiabilité des applications multi-conteneurs.
