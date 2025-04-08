---
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/Ee7InlTqcRpOiXMYtYPCIOoBcveVK7o_PWF-waDPTEVL8g?e=878SGK
thumbnailImage: ../media/azure-functions-with-aspire-thumbnail.png
title: .NET Aspire と Azure Functions を使用する
description: 現在、Azure Functions は .NET Aspire を使用して、サーバーレス テクノロジを .NET Aspire に統合できます。
area: Cloud
featureId: aspireazurefunctions

---


この Visual Studio のリリースにより、Azure Functions 開発者は、新しい Azure Functions プロジェクトを作成するときに .NET Aspire オーケストレーションを活用できるようになりました。 このオプションを選択すると、Functions プロジェクトの作成時に、アプリ ホストとサービスの既定値プロジェクトがソリューションに含まれます。

![新しい関数の作成時に .NET Aspire を追加する](../media/azure-functions-with-aspire-thumbnail.png)

既存のAzure Functionsプロジェクト (ASP.NET Core Blazor フロントエンド Web アプリと統合されているプロジェクトなど) がある場合は、このリリースより前のASP.NET Coreアプリと同様に、.NET Aspireのサポートを追加できます。

![既存の Functions プロジェクトに .NET Aspire オーケストレーションを追加する](../media/azure-functions-add-aspire-support.png)

さらに、.NET Aspire のサポートを使用して Azure Functions プロジェクトを実行またはデバッグすると、ブラウザーで .NET Aspire ダッシュボードが起動します。 これにより、Azure Functions の実行をリアルタイムで監視できます。 .NET Aspire オーケストレーターが Azure Functions の実行を管理する様子を観察したり、ダッシュボードから実行を一時停止したり再開したりすることもできます。

![.NET Aspire ダッシュボードで Azure Functions を実行する](../media/azure-functions-in-dotnet-aspire-dashboard.png)

私たちはこの統合に興奮しており、Azure Functions を .NET Aspire プロジェクトにどのように組み込むかを見るのを楽しみにしています。
