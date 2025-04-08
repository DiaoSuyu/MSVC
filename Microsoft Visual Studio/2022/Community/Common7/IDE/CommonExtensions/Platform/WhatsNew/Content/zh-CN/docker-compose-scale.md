---
devComUrl: https://github.com/microsoft/DockerTools/issues/359
thumbnailImage: ../media/docker.png
title: 将缩放添加到 Docker Compose
description: 现在支持 Docker Compose 中的 scale 属性。
area: Cloud
featureId: dockercomposescale

---


现在，你可以将 `scale` 属性添加到 Docker Compose 服务配置中，以运行特定数目的副本来进行调试。 例如，以下配置将在启动时运行 `webapi` 服务的两个实例。

![Docker 规模](../media/docker-scale.png)

通过模拟类似生产的环境，此增强功能可以更有效地对应用程序进行负载测试和调试。 它还可以更轻松地直接从 Compose 文件管理多个实例，从而简化你的工作流。 此功能对于测试服务在负载下的行为和确保应用程序可以无缝地处理多个实例特别有用。
