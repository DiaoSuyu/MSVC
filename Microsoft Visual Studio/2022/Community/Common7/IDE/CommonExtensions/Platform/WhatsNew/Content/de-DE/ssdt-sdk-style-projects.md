---
devComUrl: https://developercommunity.visualstudio.com/t/Use-new-project-file-format-for-sqlproj/480461
thumbnailImage: ../media/ssdt-thumbnail.png
title: Verwenden von SQL-Projekten im SDK-stil in SSDT
specUrl: https://techcommunity.microsoft.com/t5/azure-sql-blog/preview-release-of-sdk-style-sql-projects-in-visual-studio-2022/ba-p/4240616
description: Sie können jetzt das Projektdateiformat im SDK-Stil in Ihren SQL Server Data Tools (SSDT)-Projekten mit erweiterten Funktionen für das SQL-Debuggen und den Schemavergleich verwenden.
area: Data
featureId: ssdt-sdk

---


Im Visual Studio 17.13-Update werden Schemavergleich, Datenvergleich, Projektreferenzen und SQL-Debuggen im SDK-Stil mit SQL Server Data Tools (Vorschauversion) eingeführt. SSDT-SQL-Projekte im SDK-Stil basieren auf dem Microsoft.Build.Sql-SDK, das plattformübergreifende Unterstützung und verbesserte Continuous Integration und Continuous Delivery (CI/CD)-Funktionen für SQL Server Data Tools-Projekte bietet.

![Schemavergleich in SQL Server Data Tools im SDK-Stil](../media/ssdt_preview_schemacompare.png)

In Version 17.13 Preview 3 ist der Schemavergleich auf Datenbank- und DACPAC-Vergleiche beschränkt. Der SQL-Projektvergleich ist noch nicht verfügbar. Datenbankreferenzen sind jetzt als Projektreferenzen in der Vorschauversion 3 verfügbar, Unterstützung für Datenbankverweise als dacpac-Referenzen und Paketreferenzen werden in einer zukünftigen Version bereitgestellt. Eine kürzlich veröffentlichte Version des [slngen-Lösungsdateigenerators](https://github.com/microsoft/slngen) hat auch den Support für Microsoft.Build.Sql-Projekte hinzugefügt, wodurch die programmgesteuerte Verwaltung großer Lösungen ermöglicht wird.

Darüber hinaus wurden der Tabellen-Designer und andere Skriptoptionen im SQL Server-Objekt-Explorer verbessert. Weitere Informationen zur Verwendung des SQL-Debuggers zum Untersuchen von komplexem T-SQL-Code in Entwicklungsumgebungen finden Sie in der [Dokumentation](https://learn.microsoft.com/sql/ssdt/debugger/transact-sql-debugger).

Mit weniger ausführlichen Projektdateien und Datenbankverweise auf NuGet-Pakete können Teams effizienter an großen Datenbanken in einem einzelnen Projekt zusammenarbeiten oder mehrere Gruppen von Objekten aus mehreren Projekten kompilieren. Datenbankbereitstellungen aus einem Microsoft.Build.Sql-Projekt können in Windows- und Linux-Umgebungen automatisiert werden, in denen das Microsoft.SqlPackage-Dotnet-Tool das Buildartefakt (.dacpac) aus dem SQL-Projekt veröffentlicht. Erfahren Sie mehr über [SQL-Projekte im SDK-Stil und DevOps für SQL](https://aka.ms/sqlprojects).

Stellen Sie sicher, dass Sie die neueste SSDT-Vorschaukomponente im Visual Studio-Installationsprogramm installieren, um die SQL-Projekte im SDK-Stil in Ihrer Lösung zu verwenden.

![Installer aktiviert die SSDT-Vorschaufunktion](../media/ssdt_preview_installer.png)
