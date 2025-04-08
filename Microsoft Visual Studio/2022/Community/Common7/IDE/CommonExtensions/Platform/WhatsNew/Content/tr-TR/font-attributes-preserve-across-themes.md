---
restartRequired: true
featureFlagName: Shell.ThemeAgnosticFontSettings
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: Temalar arasında yazı tipi tercihlerini koruma
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: Temaların değiştirilmesi artık yazı tipi ve yazı tipi boyutu tercihlerinizi korur.
area: IDE
featureId: preserveFontAcrossThemes

---


Geliştiricilerin, kodlama kişisel bir seçim olduğunda seçtikleri yazı tiplerinin okunabilirlik, erişilebilirlik veya estetik tercihlerinden etkilendiğini anlıyoruz. Visual Studio temaları öncelikli olarak sunu renklerine odaklanır ve tercih ettiğiniz yazı tiplerinden bağımsızdır.

Bu güncelleştirmeyle, temaları değiştirirken yazı tipi yüzü ve boyut seçeneklerinizi korumaya yönelik işlevler sunduk. Artık yazı tipi tercihlerinizi bir kez ayarlayarak her seferinde yazı tipi ayarlarınızı yeniden yapılandırmanıza gerek kalmadan Visual Studio'da temaları değiştirebilirsiniz. Temaların amacı bu olduğundan yazı tiplerinizin renklerinin temaya bağlı kaldığına, ancak yazı tipi seçimlerinizin korunacağına dikkat edin.

![Aynı yazı tipini kullanan aynı kod parçasını gösteren Visual Studio düzenleyicisi, ancak kodun yarısı koyu temada, diğer yarısı ise açık renkte.](../media/FontAttributesPreserveAcrossThemes.png)

Bu özellik tüm kullanıcılar için varsayılan olarak etkinleştirilir. Önceki davranışı tercih ediyorsanız, [Araçlar > Önizleme Özelliklerini Yönet](vscmd://Tools.ManagePreviewFeatures)'e gidin ve **Yazı tipi ayarlarını renk teması seçiminden ayrı tut** seçeneğini bulun. Bu seçenek işaretliyse, tema değişiklikleri ne olursa olsun yazı tipi tercihleriniz korunur. Yazı tipi seçimlerini temaya bağlayan önceki davranışı yeniden devreye sokmak için kutunun işaretini kaldırın.
