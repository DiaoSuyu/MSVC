---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: Starten einer neuen Docker-Konfiguration
description: Aktivieren Sie die Unterstützung für „depends_on” mit der Startkonfigurationsoption „DependencyAwareStart”.
area: Cloud
featureId: dockerlaunchconfig

---


Wir freuen uns, eine neue Startkonfigurationsoption namens `DependencyAwareStart` einführen zu können. Wenn diese Option auf `True` festgelegt ist, ändert sie die Art und Weise, wie Docker Compose-Projekte gestartet werden, und ermöglicht so die Verwendung der `depends_on`-Anweisung in Ihrer Compose-Konfiguration.

![Docker Depends On](../media/docker-depends_on.png)

Mit diesem Feature wird sichergestellt, dass angegebene Container in der richtigen Reihenfolge gestartet werden, wobei die in Ihrer Docker Compose-Datei definierten Abhängigkeitsanforderungen eingehalten werden. Es verbessert die Stabilität und Zuverlässigkeit von Anwendungen mit mehreren Containern, indem Abhängigkeiten effektiver verwaltet werden.
