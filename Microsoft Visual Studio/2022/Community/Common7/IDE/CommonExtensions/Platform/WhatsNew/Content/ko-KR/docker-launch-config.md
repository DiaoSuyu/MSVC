---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: 새로운 Docker 구성 시작
description: depends_on 지원을 DependencyAwareStart 시작 구성 옵션을 활용하여 활성화합니다.
area: Cloud
featureId: dockerlaunchconfig

---


새 시작 구성 옵션인 `DependencyAwareStart`을 도입하게 되어 기쁩니다. 이 옵션을 `True`로 설정하면, Docker Compose 프로젝트가 시작되는 방식이 변경되고, Compose 구성에서 `depends_on` 지시어를 사용할 수 있게 됩니다.

![Docker에 따라 다름](../media/docker-depends_on.png)

이 기능을 통해 Docker Compose 파일에 정의된 종속성 요구 사항을 준수하여 지정된 컨테이너가 올바른 순서로 시작되도록 보장합니다. 종속성을 더 효율적으로 관리함으로써, 다중 컨테이너 애플리케이션의 안정성과 견고성이 더욱 향상됩니다.
