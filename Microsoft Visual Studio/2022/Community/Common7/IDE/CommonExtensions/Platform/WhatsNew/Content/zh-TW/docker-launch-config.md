---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: 啟動新的 Docker 組態
description: 使用 DependencyAwareStart 啟動設定選項啟用 depends_on 支援。
area: Cloud
featureId: dockerlaunchconfig

---


我們很高興推出一個名為 `DependencyAwareStart` 的新啟動設定選項。 設定為 `True` 時，此選項將變更 Docker Compose 專案的啟動方式，從而允許在 Compose 設定中使用 `depends_on` 指示詞。

![Docker Depends On](../media/docker-depends_on.png)

這項功能可確保指定的容器會以正確的順序啟動，並遵守 Docker Compose 檔案中定義的相依性需求。 透過更有效地管理相依性，它增強了多容器應用程式的穩健性和可靠性。
