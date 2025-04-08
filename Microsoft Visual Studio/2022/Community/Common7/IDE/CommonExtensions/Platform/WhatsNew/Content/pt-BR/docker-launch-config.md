---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: Iniciar uma nova configuração do Docker
description: Habilite o suporte a depends_on com a opção de configuração de inicialização DependencyAwareStart.
area: Cloud
featureId: dockerlaunchconfig

---


Temos o prazer de apresentar uma nova opção de configuração de lançamento chamada `DependencyAwareStart`. Quando definida como `True`, essa opção altera a forma como os projetos do Docker Compose são iniciados, habilitando o uso da diretiva `depends_on` na configuração do Compose.

![O Docker Depends On](../media/docker-depends_on.png)

Esse recurso garante que os contêineres especificados sejam iniciados na ordem correta, aderindo aos requisitos de dependência definidos no arquivo do Docker Compose. Ao gerenciar as dependências com mais eficiência, ele aumenta a robustez e a confiabilidade dos aplicativos com vários contêineres.
