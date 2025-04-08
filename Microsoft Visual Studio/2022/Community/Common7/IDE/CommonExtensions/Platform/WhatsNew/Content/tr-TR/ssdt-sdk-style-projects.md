---
devComUrl: https://developercommunity.visualstudio.com/t/Use-new-project-file-format-for-sqlproj/480461
thumbnailImage: ../media/ssdt-thumbnail.png
title: SSDT'de SDK stili SQL projelerini kullanma
specUrl: https://techcommunity.microsoft.com/t5/azure-sql-blog/preview-release-of-sdk-style-sql-projects-in-visual-studio-2022/ba-p/4240616
description: Artık gelişmiş SQL hata ayıklama ve şema karşılaştırma özellikleriyle SQL Server Veri Araçları projelerinizde SDK stili proje dosyası biçimini kullanabilirsiniz.
area: Data
featureId: ssdt-sdk

---


Visual Studio 17.13'teki güncelleştirme SDK stili SQL Server Data Tools (önizleme) ile şema karşılaştırması, veri karşılaştırması, proje referansları ve SQL hata ayıklamasını tanıtır. SDK stili SSDT SQL projeleri, SQL Server Veri Araçları (SSDT) projelerine platformlar arası desteği ve gelişmiş CI/CD özellikleri getiren Microsoft.Build.Sql SDK'yı temel alır.

![SDK stili SQL Server Veri Araçları'nda şema karşılaştırması](../media/ssdt_preview_schemacompare.png)

17.13 Önizleme 3'te şema karşılaştırması veritabanı ve .dacpac karşılaştırmalarıyla sınırlıdır; SQL proje karşılaştırması henüz kullanılamamaktadır. Veritabanı başvuruları artık önizleme 3'te proje başvuruları olarak kullanılabilir; dacpac başvuruları ve paket başvuruları olarak veritabanı başvuruları için destek gelecek bir sürümde sunulacaktır. [Slngen çözüm dosya oluşturucusunun](https://github.com/microsoft/slngen) yakın zamanda kullanıma sunulan bir sürümünde, büyük çözümleri programlı olarak yönetmeyi sağlayan Microsoft.Build.Sql projelerine yönelik destek de eklendi.

Ayrıca, SQL Server Nesne Gezgininde tablo tasarımcısı ve diğer betik seçenekleri geliştirilmiştir. [Belgelerden](https://learn.microsoft.com/sql/ssdt/debugger/transact-sql-debugger) geliştirme ortamlarındaki karmaşık T-SQL kodunu araştırmak için SQL hata ayıklayıcısını kullanma hakkında daha fazla bilgi edinin.

Daha az ayrıntılı proje dosyaları ve NuGet paketlerine yapılan veritabanı başvuruları sayesinde, ekipler tek bir projedeki büyük veritabanları üzerinde daha verimli bir şekilde işbirliği yapabilir veya çeşitli projelerden birden çok nesne kümesi derleyebilir. Bir Microsoft.Build.Sql projesinden veritabanı dağıtımları, Microsoft.SqlPackage dotnet aracının SQL projesinden derleme yapıtını (.dacpac) yayımladığı Windows ve Linux ortamlarında otomatikleştirilebilir. [SDK stili SQL projeleri ve SQL için DevOps](https://aka.ms/sqlprojects) hakkında daha fazla bilgi edinin.

Çözümünüzde SDK stili SQL projelerini kullanmak için Visual Studio yükleyicisine en son SSDT önizleme bileşenini yüklediğinizden emin olun.

![Yükleyici önizleme SSDT özelliğini etkinleştirme](../media/ssdt_preview_installer.png)
