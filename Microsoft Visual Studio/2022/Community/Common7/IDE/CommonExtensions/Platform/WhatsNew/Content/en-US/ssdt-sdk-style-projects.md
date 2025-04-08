---
devComUrl: https://developercommunity.visualstudio.com/t/Use-new-project-file-format-for-sqlproj/480461
thumbnailImage: ../media/ssdt-thumbnail.png
title: Use SDK-style SQL projects in SSDT
specUrl: https://techcommunity.microsoft.com/t5/azure-sql-blog/preview-release-of-sdk-style-sql-projects-in-visual-studio-2022/ba-p/4240616
description: You can now use the SDK-style project file format in your SQL Server Data Tools projects with enhanced SQL debugging and schema comparison capabilities.
area: Data
featureId: ssdt-sdk

---


The update in Visual Studio 17.13 introduces schema comparison, data comparison, project references, and SQL debugging to SDK-style SQL Server Data Tools (preview). SDK-style SSDT SQL projects are based on the Microsoft.Build.Sql SDK, which brings cross-platform support and improved CI/CD capabilities to SQL Server Data Tools (SSDT) projects.

![Schema compare in SDK-style SQL Server Data Tools](../media/ssdt_preview_schemacompare.png)

In 17.13 Preview 3, schema comparison is limited to database and .dacpac comparisons; SQL project comparison is not yet available. Database references are now available as project references in preview 3, support for database references as dacpac references and package references will come in a future release. A recent release of the [slngen solution file generator](https://github.com/microsoft/slngen) also added support for Microsoft.Build.Sql projects, enabling managing large solutions programatically.

Additionally, the table designer and other script options have been improved in the SQL Server Object Explorer. Learn more about using the SQL debugger to investigate complex T-SQL code in development environments from the [documentation](https://learn.microsoft.com/sql/ssdt/debugger/transact-sql-debugger).

With less verbose project files and database references to NuGet packages, teams can more efficiently collaborate on large databases in a single project or compile multiple sets of objects from several projects. Database deployments from a Microsoft.Build.Sql project can be automated in Windows and Linux environments where the Microsoft.SqlPackage dotnet tool publishes the build artifact (.dacpac) from the SQL project. Learn more about [SDK-style SQL projects and DevOps for SQL](https://aka.ms/sqlprojects).

Make sure to install the latest SSDT preview component in the Visual Studio installer to use the SDK-style SQL projects in your solution.

![Installer enable preview SSDT feature](../media/ssdt_preview_installer.png)
