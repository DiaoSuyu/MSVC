---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: Yeni bir Docker yapılandırması başlatma
description: DependencyAwareStart başlatma yapılandırma seçeneği ile depends_on desteğini etkinleştirin.
area: Cloud
featureId: dockerlaunchconfig

---


`DependencyAwareStart` adlı yeni bir başlatma yapılandırma seçeneğini tanıttığımız için heyecanlıyız. `True` olarak ayarlandığında, bu seçenek Docker Compose projelerinin başlatılma şeklini değiştirerek Oluştur yapılandırmanızda `depends_on` yönergesinin kullanımını etkinleştirir.

![Docker Bağımlılığı](../media/docker-depends_on.png)

Bu özellik, Docker Compose dosyanızda tanımlanan bağımlılık gereksinimlerine bağlı kalarak belirtilen kapsayıcıların doğru sırada başlatılmasını sağlar. Bağımlılıkları daha etkili bir şekilde yönetmek çoklu konteyner uygulamalarının sağlamlığını ve güvenilirliğini artırır.
