---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: 启动新的 Docker 配置
description: 使用 DependencyAwareStart 启动配置选项启用 depends_on 支持。
area: Cloud
featureId: dockerlaunchconfig

---


我们很高兴推出名为 `DependencyAwareStart` 的新启动配置选项。 当设置为 `True` 时，此选项将更改 Docker Compose 项目的启动方式，从而允许在 Compose 配置中使用 `depends_on` 指令。

![Docker 依赖于](../media/docker-depends_on.png)

此功能可确保指定的容器按正确的顺序启动，并遵守 Docker Compose 文件中定义的依赖项要求。 它通过更有效地管理依赖项来增强多容器应用程序的稳健性和可靠性。
