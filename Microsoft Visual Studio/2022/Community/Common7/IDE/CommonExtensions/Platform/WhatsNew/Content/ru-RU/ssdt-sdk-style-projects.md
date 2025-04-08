---
devComUrl: https://developercommunity.visualstudio.com/t/Use-new-project-file-format-for-sqlproj/480461
thumbnailImage: ../media/ssdt-thumbnail.png
title: Использование проектов SQL в стиле пакета SDK в SSDT
specUrl: https://techcommunity.microsoft.com/t5/azure-sql-blog/preview-release-of-sdk-style-sql-projects-in-visual-studio-2022/ba-p/4240616
description: Теперь в проектах SQL Server Data Tools можно использовать формат файла проекта в стиле пакета SDK с улучшенными возможностями отладки SQL и сравнения схем.
area: Data
featureId: ssdt-sdk

---


Это обновление Visual Studio 17.13 позволяет реализовать возможности сравнения схем, данных и ссылок проектов, а также отладки SQL для SQL Server Data Tools в стиле пакета SDK (предварительная версия). Проекты SSDT SQL в стиле пакета SDK основаны на пакете Microsoft.Build.Sql SDK, который обеспечивает межплатформенную поддержку и предоставляет улучшенные возможности CI/CD для проектов SQL Server Data Tools (SSDT).

![Сравнение схем в SQL Server Data Tools в стиле пакета SDK](../media/ssdt_preview_schemacompare.png)

В версии 17.13 (предварительная версия 3) сравнение схем ограничено сравнением баз данных и .dacpac. Сравнение проектов SQL пока не реализовано. Ссылки на базы данных теперь доступны как ссылки на проекты в предварительной версии 3. Поддержка ссылок на БД как ссылок DACPAC и ссылок на пакеты появится в будущем. В недавнем выпуске [генератора файлов решений slngen](https://github.com/microsoft/slngen) также была добавлена поддержка проектов Microsoft.Build.Sql, позволяющая управлять большими решениями программно.

Кроме того, в обозревателе объектов SQL Server Object Explorer были улучшены конструктор таблиц и другие параметры скриптов. Узнать больше об использовании отладчика SQL для исследования сложного кода T-SQL в средах разработки можно в [документации](https://learn.microsoft.com/sql/ssdt/debugger/transact-sql-debugger).

С менее подробными файлами проектов и ссылками базы данных на пакеты NuGet команды могут более эффективно работать над большими базами данных в одном проекте или компилировать несколько наборов объектов из нескольких проектов. Развертывание баз данных из проекта Microsoft.Build.Sql можно автоматизировать в средах Windows и Linux, где средство dotnet Microsoft.SqlPackage публикует артефакт сборки (DACPAC) из проекта SQL. Подробнее о [проектах SQL в стиле пакета SDK и DevOps для SQL](https://aka.ms/sqlprojects).

Устанавливайте новейший компонент предварительной версии SSDT в установщике Visual Studio, чтобы использовать проекты SQL в стиле пакета SDK в своем решении.

![Установщик включает предварительную версию функции SSDT](../media/ssdt_preview_installer.png)
