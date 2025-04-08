---
devComUrl: https://developercommunity.visualstudio.com/t/Use-new-project-file-format-for-sqlproj/480461
thumbnailImage: ../media/ssdt-thumbnail.png
title: 使用 SSDT 中的 SDK 樣式 SQL 專案
specUrl: https://techcommunity.microsoft.com/t5/azure-sql-blog/preview-release-of-sdk-style-sql-projects-in-visual-studio-2022/ba-p/4240616
description: 現在，您可以在 SQL Server Data Tools 專案中使用 SDK 樣式的專案檔案格式，以及增強型 SQL 偵錯與結構描述比較功能。
area: Data
featureId: ssdt-sdk

---


Visual Studio 17.13 中的更新在 SDK 樣式 SQL Server Data Tools (預覽版) 中引進了結構描述比較、資料比較、專案參考和 SQL 偵錯功能。 SDK 樣式 SSDT SQL 專案是以 Microsoft.Build.Sql SDK 為基礎，可提供跨平台的支援，並改善 SQL Server Data Tools (SSDT) 專案的 CI/CD 功能。

![SDK 樣式 SQL Server Data Tools 中的結構描述比較](../media/ssdt_preview_schemacompare.png)

17.13 Preview 3 中的結構描述比較僅限於資料庫和 .dacpac 比較；尚未提供 SQL 專案比較功能。 在預覽版 3 中，資料庫參考現在可做為專案參考，未來的版本將支援資料庫參考做為 dacpac 參考和套件參考。 最新推出的 [slngen 解決方案檔案產生器](https://github.com/microsoft/slngen)版本也新增了對於 Microsoft.Build.Sql 專案的支援，能夠以程式設計的方式管理大型解決方案。

此外，SQL Server 物件總管中的資料表設計工具和其他指令碼選項也有所改進。 請參考[文件](https://learn.microsoft.com/sql/ssdt/debugger/transact-sql-debugger)，了解更多關於使用 SQL 偵錯工具在開發環境中調查複雜 T-SQL 程式碼的資訊。

透過詳細度較低的專案檔案和 NuGet 套件的資料庫參照，團隊可以更有效率地協作單一專案的大型資料庫，或編譯數個專案的多個物件集。 Microsoft.Build.Sql 專案的資料庫部署可以在 Windows 和 Linux 環境自動化，其中 Microsoft.SqlPackage dotnet 工具會發布 SQL 專案的組建成品 (.dacpac)。 深入瞭解 [SDK 樣式 SQL 專案和適用於 SQL 的 DevOps](https://aka.ms/sqlprojects)。

請務必在 Visual Studio 安裝程式安裝最新的 SSDT 預覽元件，以便在解決方案中使用 SDK 樣式的 SQL 專案。

![安裝程式會啟用預覽版 SSDT 功能](../media/ssdt_preview_installer.png)
