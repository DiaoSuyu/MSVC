---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: 新しい Docker 構成を起動する
description: DependencyAwareStart 起動構成オプションを使用して depends_on サポートを有効にしましょう。
area: Cloud
featureId: dockerlaunchconfig

---


`DependencyAwareStart`と呼ばれる新しい起動構成オプションが導入されました。 `True`に設定すると、このオプションによって Docker Compose プロジェクトの起動方法が変更され、Compose 構成で `depends_on` ディレクティブを使用できるようになります。

![Docker の Depends On](../media/docker-depends_on.png)

この機能により、Docker Compose ファイルで定義された依存関係の要件に従って、指定されたコンテナーが正しい順序で起動されるようになります。 依存関係をより効果的に管理することで、マルチコンテナー アプリケーションの堅牢性と信頼性が向上します。
