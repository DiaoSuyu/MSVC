---
devComUrl: https://developercommunity.visualstudio.com/t/Use-new-project-file-format-for-sqlproj/480461
thumbnailImage: ../media/ssdt-thumbnail.png
title: Uso de proyectos de SQL de estilo SDK en SSDT
specUrl: https://techcommunity.microsoft.com/t5/azure-sql-blog/preview-release-of-sdk-style-sql-projects-in-visual-studio-2022/ba-p/4240616
description: Ahora puede usar el formato de archivo de proyecto de estilo SDK en los proyectos de SQL Server Data Tools con capacidades mejoradas de depuración de SQL y comparación de esquemas.
area: Data
featureId: ssdt-sdk

---


La actualización en Visual Studio 17.13 presenta la comparación de esquemas, la comparación de datos, referencias de proyectos y la depuración de SQL con SQL Server Data Tools (versión preliminar) de estilo SDK. Los proyectos de SSDT SQL de estilo SDK están basados en el SDK de Microsoft.Build.Sql, que ofrece compatibilidad multiplataforma y funcionalidades de CI/CD mejoradas a proyectos de SQL Server Data Tools (SSDT).

![Comparación de esquemas en SQL Server Data Tools de estilo SDK](../media/ssdt_preview_schemacompare.png)

En la versión preliminar 3 17.13, la comparación de esquemas se limita a las comparaciones de base de datos y .dacpac; la comparación de proyectos de SQL aún no está disponible. Las referencias de base de datos ahora están disponibles como referencias de proyecto en la versión preliminar 3, la compatibilidad con las referencias de base de datos como referencias de dacpac y las referencias de paquete aparecerán en una versión futura. Una versión reciente del [generador de archivos de solución slngen](https://github.com/microsoft/slngen) también agregó compatibilidad con proyectos Microsoft.Build.Sql, lo que permite administrar soluciones grandes mediante programación.

Además, el diseñador de tablas y otras opciones de script se han mejorado en el Explorador de objetos de SQL Server. Obtenga más información sobre el uso del depurador de SQL para investigar el código T-SQL complejo en entornos de desarrollo con la [documentación](https://learn.microsoft.com/sql/ssdt/debugger/transact-sql-debugger).

Con archivos de proyecto y referencias de base de datos menos detallados a paquetes NuGet, los equipos pueden colaborar de forma más eficaz en bases de datos grandes en un solo proyecto o compilar varios conjuntos de objetos de varios proyectos. Las implementaciones de base de datos de un proyecto Microsoft.Build.Sql se pueden automatizar en entornos de Windows y Linux en los que la herramienta dotnet de Microsoft.SqlPackage publica el artefacto de compilación (.dacpac) desde el proyecto SQL. Obtenga más información sobre los [proyectos SQL de estilo SDK y DevOps para SQL](https://aka.ms/sqlprojects).

Asegúrese de instalar el componente de versión preliminar de SSDT más reciente en el instalador de Visual Studio para usar los proyectos SQL de estilo SDK en la solución.

![Característica de SSDT de habilitación de la versión preliminar del instalador](../media/ssdt_preview_installer.png)
