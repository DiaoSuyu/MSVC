---
devComUrl: https://github.com/microsoft/DockerTools/issues/359
thumbnailImage: ../media/docker.png
title: Adicionar escala ao Docker Compose
description: A propriedade de escala no Docker Compose agora é compatível.
area: Cloud
featureId: dockercomposescale

---


Agora você pode adicionar a `scale` propriedade em sua configuração de serviço do Docker Compose para depurar com um número específico de réplicas em execução. Por exemplo, a configuração abaixo executará duas instâncias do serviço `webapi` quando lançada.

![Escala do Docker](../media/docker-scale.png)

Esse aprimoramento permite testes de carga e depuração mais eficazes de seus aplicativos, simulando um ambiente semelhante ao de produção. Ele também simplifica seu fluxo de trabalho, facilitando o gerenciamento de várias instâncias diretamente do arquivo Compose. Esse recurso é particularmente útil para testar o comportamento de seus serviços sob carga e garantir que seu aplicativo possa lidar com várias instâncias sem problemas.
