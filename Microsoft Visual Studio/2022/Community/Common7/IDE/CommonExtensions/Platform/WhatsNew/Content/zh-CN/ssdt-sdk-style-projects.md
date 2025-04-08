---
devComUrl: https://developercommunity.visualstudio.com/t/Use-new-project-file-format-for-sqlproj/480461
thumbnailImage: ../media/ssdt-thumbnail.png
title: 在 SSDT 中使用 SDK 样式的 SQL 项目
specUrl: https://techcommunity.microsoft.com/t5/azure-sql-blog/preview-release-of-sdk-style-sql-projects-in-visual-studio-2022/ba-p/4240616
description: 现在，你可以在具有增强的 SQL 调试和架构比较功能的 SQL Server Data Tools 项目中使用 SDK 样式的项目文件格式。
area: Data
featureId: ssdt-sdk

---


Visual Studio 17.13 中的更新为 Visual Studio 17.13 中的 SDK 风格 SQL Server Data Tools（预览版）引入了架构比较、数据比较、项目首选项和 SQL 调试。 SDK 样式的 SSDT SQL 项目基于 Microsoft.Build.Sql SDK，该 SDK 为 SQL Server Data Tools (SSDT) 项目带来了跨平台支持和改进的 CI/CD 功能。

![SDK 样式 SQL Server Data Tools 中的架构比较](../media/ssdt_preview_schemacompare.png)

在 17.13 预览版 3 中，架构比较仅限于数据库和 .dacpac 比较；SQL 项目比较尚不可用。 数据库引用现已作为预览版 3 中的项目引用提供，支持作为 dacpac 引用和包引用的数据库引用将在未来版本中提供。 [slngen 解决方案文件生成器](https://github.com/microsoft/slngen)的最新版本还添加了对 Microsoft.Build.Sql 项目的支持，从而能够以编程方式管理大型解决方案。

此外，SQL Server 对象资源管理器中的表设计器和其他脚本选项也得到了改进。 从[文档](https://learn.microsoft.com/sql/ssdt/debugger/transact-sql-debugger)中了解有关使用 SQL 调试器在开发环境中调查复杂 T-SQL 代码的更多信息。

通过减少冗长的项目文件和对 NuGet 包的数据库引用，团队可以在单个项目中更有效地在大型数据库上进行协作，或者从多个项目中编译多组对象。 Microsoft.Build.Sql 项目中的数据库部署可以在 windows 和 Linux 环境中自动执行，其中 Microsoft.SqlPackage dotnet 工具从 SQL 项目发布生成项目 (.dacpac)。 深入了解 [SDK 样式 SQL 项目和适用于 SQL 的 DevOps](https://aka.ms/sqlprojects)。

请确保在 Visual Studio 安装程序中安装最新的 SSDT 预览组件，以在解决方案中使用 SDK 样式的 SQL 项目。

![安装程序启用预览版 SSDT 功能](../media/ssdt_preview_installer.png)
