---
devComUrl: https://github.com/microsoft/DockerTools/issues/359
thumbnailImage: ../media/docker.png
title: Docker Compose'a ölçek ekleme
description: Artık Docker Compose'daki ölçek özelliği desteklenmektedir.
area: Cloud
featureId: dockercomposescale

---


Artık Docker Compose hizmet yapılandırmanıza `scale` özelliği ekleyerek belirli sayıda replika çalışırken hata ayıklayabilirsiniz. Örneğin, aşağıdaki yapılandırma başlatıldığında `webapi` hizmetinin iki örneğini çalıştıracaktır.

![Docker Ölçeği](../media/docker-scale.png)

Bu geliştirme, üretim benzeri bir ortamı simüle ederek uygulamalarınızda daha etkili yük test etme ve hata ayıklama olanağı sağlar. Ayrıca, birden fazla örneği doğrudan Compose dosyanızdan yönetmeyi kolaylaştırarak iş akışınızı kolaylaştırır. Bu özellik, özellikle yük altındaki hizmetlerinizin davranışını test etmek ve uygulamanızın birden fazla örneği sorunsuz bir şekilde işleyebilmesini sağlamak için yararlıdır.
