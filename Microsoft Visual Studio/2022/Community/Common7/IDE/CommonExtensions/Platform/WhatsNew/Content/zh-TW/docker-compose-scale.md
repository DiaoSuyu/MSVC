---
devComUrl: https://github.com/microsoft/DockerTools/issues/359
thumbnailImage: ../media/docker.png
title: 新增 scale 至 Docker Compose
description: 現在支援 Docker Compose 中的 scale 屬性。
area: Cloud
featureId: dockercomposescale

---


現在您可以將 `scale` 屬性新增至 Docker Compose 服務設定中，以便在執行特定數量的複本的情況下進行偵錯。 例如，下面的設定將在啟動時執行兩個 `webapi` 服務的執行個體。

![Docker Scale](../media/docker-scale.png)

此項增強功能透過模擬類似生產環境，可更有效率地測試和偵錯應用程式。 它還簡化了您的工作流程，使您可以直接從 Compose 檔案輕鬆管理多個執行個體。 此功能對於測試您的服務在負載下的行為，以及確保您的應用程式可以順暢地處理多個執行個體特別有用。
