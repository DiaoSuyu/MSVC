---
devComUrl: https://github.com/microsoft/DockerTools/issues/359
thumbnailImage: ../media/docker.png
title: Přidání škálování do Docker Compose
description: Nyní je podporovaná vlastnost škálování v Docker Compose.
area: Cloud
featureId: dockercomposescale

---


Přidání vlastnosti `scale` do konfigurace služby Docker Compose umožňuje ladění s určitým počtem spuštěných replik. Například následující konfigurace při spuštění spustí dvě instance služby `webapi`.

![Škálování Dockeru](../media/docker-scale.png)

Toto vylepšení umožňuje efektivnější zátěžové testování a ladění aplikací díky simulaci provozního prostředí. Zjednodušuje také pracovní postup, protože lze spravovat více instancí přímo ze souboru Compose. Tato funkce je zvláště užitečná k testování chování služeb při zatížení a k zajištění bezproblémového zpracování více instancí ve vaší aplikaci.
