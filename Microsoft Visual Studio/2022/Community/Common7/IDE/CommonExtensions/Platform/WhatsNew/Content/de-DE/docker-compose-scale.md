---
devComUrl: https://github.com/microsoft/DockerTools/issues/359
thumbnailImage: ../media/docker.png
title: Hinzufügen von Skalierung zu Docker Compose
description: Die scale-Eigenschaft in Docker Compose wird jetzt unterstützt.
area: Cloud
featureId: dockercomposescale

---


Sie können Ihrer Docker Compose-Dienstkonfiguration jetzt die `scale`-Eigenschaft hinzufügen, um das Debuggen mit einer bestimmten Anzahl ausgeführter Replikate durchzuführen. Die folgende Konfiguration führt beim Start beispielsweise zwei Instanzen des `webapi`-Diensts aus.

![Docker-Skalierung](../media/docker-scale.png)

Diese Erweiterung ermöglicht ein effektiveres Ladentests und Debuggen Ihrer Anwendungen, indem eine produktionsähnliche Umgebung simuliert wird. Außerdem wird Ihr Workflow optimiert, indem es die Verwaltung mehrerer Instanzen direkt aus ihrer Compose-Datei erleichtert. Dieses Feature ist besonders nützlich, um das Verhalten Ihrer Dienste unter Last zu testen und sicherzustellen, dass Ihre Anwendung mehrere Instanzen nahtlos unterstützen kann.
