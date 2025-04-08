---
devComUrl: https://github.com/microsoft/DockerTools/issues/359
thumbnailImage: ../media/docker.png
title: Dodawanie skalowania do narzędzia Docker Compose
description: Teraz w narzędziu Docker Compose obsługiwana jest właściwość skalowania.
area: Cloud
featureId: dockercomposescale

---


Teraz możesz dodać właściwość `scale` do konfiguracji usługi Docker Compose w celu debugowania z określoną liczbą uruchomionych replik. Na przykład poniższa konfiguracja spowoduje uruchomienie dwóch wystąpień usługi `webapi` po uruchomieniu.

![Skalowanie platformy Docker](../media/docker-scale.png)

To ulepszenie umożliwia bardziej efektywne testowanie obciążenia i debugowanie aplikacji przez symulowanie środowiska przypominającego środowisko produkcyjne. Usprawnia również przepływ pracy, ułatwiając zarządzanie wieloma instancjami bezpośrednio z pliku Compose. Funkcja jest szczególnie przydatna do testowania zachowania usług pod obciążeniem i zapewnienia, że aplikacja może bezproblemowo obsługiwać wiele wystąpień.
