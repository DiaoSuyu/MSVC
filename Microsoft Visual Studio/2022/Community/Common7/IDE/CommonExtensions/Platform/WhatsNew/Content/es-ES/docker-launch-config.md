---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: Inicio de una nueva configuración de Docker
description: Habilite la compatibilidad de depends_on con la opción de configuración de inicio DependencyAwareStart.
area: Cloud
featureId: dockerlaunchconfig

---


Nos complace presentar una nueva opción de configuración de inicio denominada `DependencyAwareStart`. Cuando se establece en `True`, esta opción cambia la forma en que se inician los proyectos de Docker Compose, lo que habilita el uso de la directiva `depends_on` en la configuración de Compose.

![Depends On de Docker](../media/docker-depends_on.png)

Esta característica garantiza que los contenedores especificados se inicien en el orden correcto, cumpliendo los requisitos de dependencia definidos en el archivo de Docker Compose. Además, mejora la solidez y confiabilidad de las aplicaciones de varios contenedores mediante la administración de dependencias de forma más eficaz.
