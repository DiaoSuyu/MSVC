---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: Spuštění nové konfigurace Dockeru
description: Povolení podpory depends_on s možností konfigurace spouštění DependencyAwareStart.
area: Cloud
featureId: dockerlaunchconfig

---


S potěšením představujeme novou možnost konfigurace spouštění s názvem `DependencyAwareStart`. Nastavení této možnosti na `True` změní způsob spouštění projektů Docker Compose a povolí použití direktivy `depends_on` v konfiguraci Compose.

![Závislosti Dockeru](../media/docker-depends_on.png)

Tato funkce zajišťuje, že se zadané kontejnery spustí ve správném pořadí a dodrží požadavky závislosti definované v souboru Docker Compose. Díky efektivnější správě závislostí zvyšuje robustnost a spolehlivost vícekontejnerových aplikací.
