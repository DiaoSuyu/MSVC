---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: Запуск новой конфигурации Docker
description: Включение поддержки depends_on с помощью параметра конфигурации DependencyAwareStart.
area: Cloud
featureId: dockerlaunchconfig

---


Мы рады представить новую опцию конфигурации запуска под названием `DependencyAwareStart`. Когда установлено значение `True`, эта опция изменяет способ запуска проектов Docker Compose, благодаря чему можно использовать директиву `depends_on` в вашей конфигурации Compose.

![Атрибут depends_on в Docker](../media/docker-depends_on.png)

Эта функция обеспечивает запуск указанных контейнеров в правильном порядке, с соблюдением требований зависимостей, определенных в файле Docker Compose. Более эффективное управление зависимостями повышает надежность и безопасность многоконтейнерных приложений.
