---
devComUrl: https://developercommunity.visualstudio.com/t/Use-new-project-file-format-for-sqlproj/480461
thumbnailImage: ../media/ssdt-thumbnail.png
title: SSDT에서 SDK 스타일 SQL 프로젝트 사용하기
specUrl: https://techcommunity.microsoft.com/t5/azure-sql-blog/preview-release-of-sdk-style-sql-projects-in-visual-studio-2022/ba-p/4240616
description: 이제 향상된 SQL 디버깅 및 스키마 비교 기능을 갖춘 SQL Server Data Tools 프로젝트에서 SDK 스타일 프로젝트 파일 형식을 사용할 수 있습니다.
area: Data
featureId: ssdt-sdk

---


Visual Studio 17.13의 업데이트는 SDK 스타일 SQL Server Data Tools(미리 보기)에 스키마 비교, 데이터 비교, 프로젝트 참조 및 SQL 디버깅 기능을 추가합니다. SDK 스타일 SSDT SQL 프로젝트는 Microsoft.Build.Sql SDK를 기반으로 하며, 이를 통해 SQL Server Data Tools(SSDT) 프로젝트에 크로스 플랫폼 지원과 향상된 CI/CD 기능을 제공합니다.

![SDK 스타일 SQL Server Data Tools의 스키마 비교](../media/ssdt_preview_schemacompare.png)

17.13 미리 보기 3에서는 스키마 비교가 데이터베이스 및 .dacpac 비교로 제한됩니다. SQL 프로젝트 비교는 아직 사용할 수 없습니다. 데이터베이스 참조는 이제 미리 보기 3에서 프로젝트 참조로 제공되며, 데이터베이스 참조를 dacpac 참조와 패키지 참조로 지원하는 기능은 향후 릴리스에서 제공될 예정입니다. 최근에 출시된 [slngen 솔루션 파일 생성기](https://github.com/microsoft/slngen)는 Microsoft.Build.Sql 프로젝트에 대한 지원도 추가하여 대규모 솔루션을 프로그래밍 방식으로 관리할 수 있게 했습니다.

또한 SQL Server Object Explorer 테이블 디자이너 및 기타 스크립트 옵션이 개선되었습니다. 개발 환경에서 복잡한 T-SQL 코드를 조사하는 SQL 디버거 사용에 대해 더 알아보려면 [문서](https://learn.microsoft.com/sql/ssdt/debugger/transact-sql-debugger)를 참조하세요.

많은 정보를 담은 프로젝트 파일 및 NuGet 패키지에 대한 데이터베이스 참조를 줄이면 팀은 단일 프로젝트에서 대규모 데이터베이스에 대해 보다 효율적으로 공동 작업하거나 여러 프로젝트에서 여러 개체 집합을 컴파일할 수 있습니다. Microsoft.SqlPackage dotnet 도구가 SQL 프로젝트에서 빌드 아티팩트(.dacpac)를 게시하는 Windows 및 Linux 환경에서 Microsoft.Build.Sql 프로젝트의 데이터베이스 배포를 자동화할 수 있습니다. [SDK 스타일 SQL 프로젝트 및 SQL을 위한 DevOps](https://aka.ms/sqlprojects)에 대해 더 알아보세요.

솔루션에서 SDK 스타일 SQL 프로젝트를 사용하도록 Visual Studio 설치 관리자에 있는 최신 SSDT 미리 보기 구성 요소를 설치해야 합니다.

![설치 관리자 SSDT 기능 미리 보기 사용](../media/ssdt_preview_installer.png)
