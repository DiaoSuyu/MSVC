---
restartRequired: true
featureFlagName: Shell.ThemeAgnosticFontSettings
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: 테마 간 글꼴 기본 설정 유지
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: 테마를 변경해도 이제 글꼴 및 글꼴 크기 설정이 유지됩니다.
area: IDE
featureId: preserveFontAcrossThemes

---


개발자가 코딩할 때 선택하는 글꼴이 가독성, 접근성 또는 미관에 대한 선호도에 영향을 받는 개인적인 선택이라는 것을 알고 있습니다. Visual Studio 테마는 주로 프레젠테이션 색에 포커스를 맞추며 기본 글꼴과 무관합니다.

이 업데이트에서는 테마를 전환할 때 글꼴과 크기 선택 사항을 보존하는 기능이 도입되었습니다. 이제 글꼴 기본 설정을 한 번만 지정하고, 매번 글꼴 설정을 다시 구성할 필요 없이 Visual Studio에서 테마를 전환할 수 있습니다. 테마의 목적에 따라 글꼴 색은 테마와 연결된 상태로 유지되지만, 글꼴은 사용자 선택에 따라 적용됩니다.

![동일한 글꼴을 사용하여 동일한 코드를 표시하는 Visual Studio 편집기이지만, 코드의 절반은 어두운 테마이고 절반은 밝은 테마입니다.](../media/FontAttributesPreserveAcrossThemes.png)

이 기능은 모든 사용자에게 기본적으로 사용하도록 설정됩니다. 이전 동작을 선호하는 경우 [도구 > 미리 보기 기능 관리](vscmd://Tools.ManagePreviewFeatures)로 이동하여 **색 테마 선택에서 글꼴 설정 분리** 옵션을 찾습니다. 이 옵션을 선택하면 테마가 변경되어도 글꼴 기본 설정이 유지됩니다. 글꼴 선택을 테마에 연결하는 이전 동작을 복구하려면 상자 선택을 취소합니다.
