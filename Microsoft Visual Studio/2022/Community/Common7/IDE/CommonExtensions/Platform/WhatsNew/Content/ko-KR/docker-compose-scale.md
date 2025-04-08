---
devComUrl: https://github.com/microsoft/DockerTools/issues/359
thumbnailImage: ../media/docker.png
title: Docker Compose에 스케일 추가하기
description: 이제 Docker Compose의 scale 속성이 지원됩니다.
area: Cloud
featureId: dockercomposescale

---


이제 Docker Compose 서비스 구성에 `scale` 속성을 추가하여 특정 수의 복제본이 실행되는 상태에서 디버깅할 수 있습니다. 예를 들어, 아래 구성은 실행 시 `webapi` 서비스의 인스턴스 두 개를 실행합니다.

![Docker 규모](../media/docker-scale.png)

이 향상된 기능을 사용하면 프로덕션과 유사한 환경을 시뮬레이션하여 애플리케이션의 부하 테스트 및 디버깅을 보다 효율적으로 수행할 수 있습니다. 다수의 인스턴스 관리를 Compose 파일에서 직접 손쉽게 수행 가능하게 함으로써 워크플로우를 간소화합니다. 이 기능은 로드 중인 서비스의 동작을 테스트하고 애플리케이션이 여러 인스턴스를 원활하게 처리할 수 있도록 하는 데 특히 유용합니다.
