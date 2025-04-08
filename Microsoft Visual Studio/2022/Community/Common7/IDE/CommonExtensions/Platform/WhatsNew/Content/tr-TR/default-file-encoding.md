---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: Dosya kodlamayı özelleştir
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: Visual Studio'da dosyaları kaydetmek için varsayılan kodlamayı belirtin.
area: Productivity
featureId: DefaultFileEncoding

---


Platformlar arası ortamlarda çalışan geliştiricilerin genellikle belirli dosya kodlamalarıyla dosyaların kaydedilmesi gerekir. Bu kodlamaların değiştirilmesi çeşitli sorunlara yol açabilir.

Visual Studio artık dosyaları kaydetmek için varsayılan dosya kodlamasını ayarlamanıza olanak tanır. Bu özellik, tercih ettiğiniz kodlamanın mümkün olduğunca kullanılmasını sağlar.

Varsayılan kodlamayı ayarlamak için **Araçlar > Seçenekler > Ortam > Belgeler** konumuna gidin. Burada, **Dosyaları belirli bir kodlamayla kaydet** başlıklı bir seçenek bulacaksınız. Bu seçenek işaretlenmezse Visual Studio varsayılan davranışını kullanarak dosya kodlamasını yönetir. İşaretlenirse Visual Studio bir dosya kaydedildiğinde bitişikte açılan kutuda belirtilen kodlamayı kullanır.

![Araçlar\Seçenekler'deki varsayılan dosya kodlama seçeneği](../media/default-file-encoding.png)

Visual Studio belirtilen kodlamayla kaydedemezse (örneğin, Unicode karakterleri içeren bir dosya için *ASCII* kodlaması istemesi), sorunu size bildiren bir iletişim kutusu görüntüler.
