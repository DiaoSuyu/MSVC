---
devComUrl: https://developercommunity.visualstudio.com/t/fix-scroll-bars/1087969
thumbnailImage: ../media/horizontal-scroll-bar-thumbnail.png
title: Yatay kaydırma çubuğunu yeniden tasarlama
description: Düzenleyicideki yatay kaydırma çubuğu, alan sınırlı olsa bile kendisini her zaman erişilebilir olacak şekilde konumlayabiliyor.
area: Productivity
featureId: EditorHorizontalScrollbarPersistence

---


Visual Studio'daki düzenleyici tepsisi, çok sayıda bilgi için değerli bir alandır. Yakınlaştırmayı kontrol edebilir, belgenizin durumunu denetleyebilir, hangi satırda olduğunuzu ve çeşitli ek bilgilere erişebilirsiniz.

Ne yazık ki, bazen tüm bu bilgiler yatay kaydırma çubuğunun dışına çıkıp pencerenizde gezinmeyi zorlaştırabilir. Bu durum özellikle sistem tepsisinin çok geniş olmadığı yan yana görünümde yaşanır.

Bu son güncelleştirmeyle artık bu zorluklar geçmişte kaldı. Kaydırma çubuğu kullanılabilir bir genişliğin altına düşerse her zaman erişebilir olması için sistem tepsisinin üzerinde yeniden konumlanır. Varsayılan olarak yeniden yeterli alan bulunduğunda düzenleyici tepsisine geri döner.

![Düzenleyici tepsisinin üzerinde görüntülenen yatay kaydırma çubuğu](../media/horizontal-scroll-bar-thumbnail.png)

Bu davranışın çoğu kullanıcı için ideal olduğuna inansak da, herhangi bir sorunla karşılaşırsanız, davranışı **Araçlar > Seçenekler** bölümünden denetleyebilirsiniz. Seçenek, **Metin Düzenleyicisi > Gelişmiş** bölümü altında yer alır ve **Düzenleyici yatay kaydırma çubuğu konumu** olarak etiketlenir. Bu ayar, kaydırma çubuğunun konumunu kullanılabilir alana göre ayarlamasını, düzenleyici tepsisinde kalmasını veya her zaman düzenleyici tepsisinin üzerinde görünmesini seçmenize olanak tanır.

![Yatay Kaydırma Çubuğu Ayarı](../media/horizontal-scroll-bar-setting.png)
