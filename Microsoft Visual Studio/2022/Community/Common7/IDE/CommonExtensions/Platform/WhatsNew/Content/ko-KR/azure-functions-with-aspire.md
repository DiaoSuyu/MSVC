---
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/Ee7InlTqcRpOiXMYtYPCIOoBcveVK7o_PWF-waDPTEVL8g?e=878SGK
thumbnailImage: ../media/azure-functions-with-aspire-thumbnail.png
title: .NET Aspire와 Azure Functions 활용
description: Azure Functions는 이제 .NET Aspire를 사용하여 서버리스 기술을 .NET Aspire에 통합할 수 있습니다.
area: Cloud
featureId: aspireazurefunctions

---


이번 Visual Studio 릴리스에서는 Azure Functions 개발자가 새로운 Azure Functions 프로젝트를 생성할 때 .NET Aspire 오케스트레이션을 활용할 수 있습니다. 이 옵션을 선택하면, Functions 프로젝트가 생성될 때 App Host와 Service Defaults 프로젝트가 솔루션에 포함됩니다.

![새 함수 생성 시 .NET Aspire 추가하기](../media/azure-functions-with-aspire-thumbnail.png)

기존 Azure Functions 프로젝트가 있으면, 예를 들어 ASP.NET Core Blazor 프론트엔드 웹 앱과 통합된 경우, 이번 릴리스 이전에 ASP.NET Core 앱에서 했던 것처럼 .NET Aspire 지원을 추가할 수 있습니다.

![기존 Functions 프로젝트에 .NET Aspire 오케스트레이션 추가하기](../media/azure-functions-add-aspire-support.png)

또한 .NET Aspire 지원을 사용하여 Azure Functions 프로젝트를 실행하거나 디버깅하면 브라우저에서 .NET Aspire 대시보드가 시작됩니다. 이렇게 하면 Azure Functions의 실행을 실시간으로 모니터링할 수 있습니다. Azure Functions 실행을.NET Aspire 오케스트레이터가 어떻게 관리하는지 확인할 수 있으며, 대시보드에서 Azure Functions 실행을 일시 중지하거나 다시 시작할 수도 있습니다.

![.NET Aspire 대시보드에서 Azure Functions 실행하기](../media/azure-functions-in-dotnet-aspire-dashboard.png)

이 통합에 대해 매우 기쁘게 생각하며, Azure Functions를 .NET Aspire 프로젝트에 어떻게 통합하실지 기대하고 있습니다.
