---
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/Ee7InlTqcRpOiXMYtYPCIOoBcveVK7o_PWF-waDPTEVL8g?e=878SGK
thumbnailImage: ../media/azure-functions-with-aspire-thumbnail.png
title: 利用 .NET Aspire 和 Azure Functions
description: Azure Functions 現在可以使用 .NET Aspire，將無伺服器技術整合到 .NET Aspire 中。
area: Cloud
featureId: aspireazurefunctions

---


透過此版本的 Visual Studio，Azure Functions 開發人員現在可以在建立新的 Azure Functions 專案時利用 .NET Aspire 協調流程。 透過選擇此選項，在建立 Functions 專案時，App Host 和 Service Defaults 專案將包含在解決方案中。

![在建立新的 Function 時新增 .NET Aspire](../media/azure-functions-with-aspire-thumbnail.png)

如果您有一個現有的 Azure Functions 專案 (例如與 ASP.NET Core Blazor 前端 Web 應用程式整合的專案)，則可以向其新增 .NET Aspire 支援，就像您在此版本之前使用的 ASP.NET Core 應用程式一樣。

![新增 .NET Aspire 協調流程至現有的 Functions 專案](../media/azure-functions-add-aspire-support.png)

此外，執行或偵錯具有 .NET Aspire 支援的 Azure Functions 專案將在瀏覽器中啟動 .NET Aspire 儀表板。 這使您可以即時監控 Azure Functions 的執行情況。 您可以觀察 .NET Aspire 協調器如何管理 Azure Functions 的執行，甚至可以從儀表板暫停並還原其執行。

![在 .NET Aspire 儀表板中執行 Azure Functions](../media/azure-functions-in-dotnet-aspire-dashboard.png)

我們對這樣的整合感到非常興奮，並期待看到您如何將 Azure Functions 合併到您的 .NET Aspire 專案中。
