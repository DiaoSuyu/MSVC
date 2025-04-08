---
devComUrl: https://developercommunity.visualstudio.com/t/Use-new-project-file-format-for-sqlproj/480461
thumbnailImage: ../media/ssdt-thumbnail.png
title: Používání projektů SQL ve stylu SDK v SSDT
specUrl: https://techcommunity.microsoft.com/t5/azure-sql-blog/preview-release-of-sdk-style-sql-projects-in-visual-studio-2022/ba-p/4240616
description: Nyní můžete ve svých projektech SQL Server Data Tools používat formát souboru projektu ve stylu SDK s vylepšenými funkcemi ladění SQL a porovnávání schémat.
area: Data
featureId: ssdt-sdk

---


Aktualizace ve Visual Studio 17.13 přináší porovnání schématu, porovnání dat, odkazy na projekt a ladění SQL v SQL Server Data Tools (Preview). Projekty SSDT SQL jsou založené na sadě SDK projektu Microsoft.Build.Sql a přináší podporu pro různé platformy a vylepšené funkce CI/CD pro projekty SQL Server Data Tools (SSDT).

![Porovnání schématu v nástrojích SQL Server Data Tools ve stylu SDK](../media/ssdt_preview_schemacompare.png)

Ve verzi 17.13 Preview 3 je porovnání schématu omezené na porovnání databáze a .dacpac. Porovnání projektů SQL zatím není k dispozici. Odkazy na databáze jsou nyní k dispozici jako odkazy na projekty ve verzi Preview 3, podpora odkazů na databáze jako odkazy dacpac a odkazy na balíčky budou k dispozici v budoucí verzi. Nedávná verze [generátoru souborů řešení slngen](https://github.com/microsoft/slngen) také přidala podporu projektů Microsoft.Build.Sql, která umožňuje programově spravovat rozsáhlá řešení.

Navíc byl v Průzkumníku objektů systému SQL Server vylepšen návrhář tabulek a další možnosti skriptů. Přečtěte si další informace o použití ladicího programu SQL k prozkoumání složitého kódu T-SQL ve vývojových prostředích v [dokumentaci](https://learn.microsoft.com/sql/ssdt/debugger/transact-sql-debugger).

Díky méně podrobným souborům projektu a databázovým odkazům na balíčky NuGet můžou týmy efektivněji spolupracovat na velkých databázích v jednom projektu nebo kompilovat více sad objektů z několika projektů. Nasazení databází z projektu Microsoft.Build.Sql je možné automatizovat v prostředích s Windows a Linuxem, kde nástroj Microsoft.SqlPackage dotnet publikuje z projektu SQL artefakt buildu (.dacpac). Přečtěte si další informace o [projektech SQL ve stylu SDK a DevOps pro SQL](https://aka.ms/sqlprojects).

Pokud chcete ve svém řešení používat projekty SQL ve stylu SDK, nezapomeňte do instalačního programu sady Visual Studio nainstalovat nejnovější součást SSDT ve verzi Preview.

![Instalační program s povolenou funkcí SSDT ve verzi Preview](../media/ssdt_preview_installer.png)
