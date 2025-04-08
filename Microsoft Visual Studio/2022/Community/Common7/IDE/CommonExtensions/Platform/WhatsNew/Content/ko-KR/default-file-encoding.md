---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: 파일 인코딩 사용자 지정
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: Visual Studio에서 파일을 저장하기 위한 기본 인코딩을 지정합니다.
area: Productivity
featureId: DefaultFileEncoding

---


플랫폼 간 환경에서 작업하는 개발자는 특정 파일 인코딩을 사용하여 파일을 저장해야 하는 경우가 많습니다. 이러한 인코딩을 변경하면 다양한 문제가 발생할 수 있습니다.

이제 Visual Studio를 사용하여 파일을 저장하기 위한 기본 파일 인코딩을 설정할 수 있습니다. 이 기능을 사용하면 가능하면 원하는 인코딩을 사용할 수 있습니다.

기본 인코딩을 설정하려면 **도구 > 옵션 > 환경 > 문서**로 이동하세요. 거기에서 **특정 인코딩으로 파일 저장**이라는 옵션을 찾을 수 있습니다. 이 옵션이 선택 해제되면, Visual Studio는 기본 동작을 사용하여 파일 인코딩을 관리합니다. 이 옵션을 선택하면 Visual Studio는 파일이 저장될 때마다 인접한 콤보 상자에 지정된 인코딩을 사용합니다.

![도구\옵션에서의 기본 파일 인코딩 옵션](../media/default-file-encoding.png)

만약 Visual Studio가 지정된 인코딩으로 저장할 수 없다면(예: 유니코드 문자가 포함된 파일에 대해 *ASCII* 인코딩을 요청할 경우), 문제를 알리는 대화 상자가 표시됩니다.
