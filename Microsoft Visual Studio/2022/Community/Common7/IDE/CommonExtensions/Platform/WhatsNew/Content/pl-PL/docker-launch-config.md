---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: Uruchamianie nowej konfiguracji platformy Docker
description: Włącz obsługę depends_on za pomocą opcji uruchamiania konfiguracji DependencyAwareStart.
area: Cloud
featureId: dockerlaunchconfig

---


Z przyjemnością przedstawiamy nową opcję konfiguracji uruchamiania o nazwie `DependencyAwareStart`. Po ustawieniu wartości `True` opcja zmienia sposób uruchamiania projektów narzędzia Docker Compose, umożliwiając korzystanie z `depends_on` dyrektywy w konfiguracji redagowania.

![Platforma Docker zależy od](../media/docker-depends_on.png)

Ta funkcja zapewnia, że określone kontenery są uruchamiane w odpowiedniej kolejności, przestrzegając wymagań dotyczących zależności zdefiniowanych w pliku Docker Compose. Ponadto zwiększa niezawodność aplikacji wieloskładnikowych dzięki bardziej efektywnemu zarządzaniu zależnościami.
