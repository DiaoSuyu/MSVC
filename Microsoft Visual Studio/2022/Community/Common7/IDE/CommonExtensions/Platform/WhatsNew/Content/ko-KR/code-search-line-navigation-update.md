---
devComUrl: https://developercommunity.visualstudio.com/t/Support-Filenamelinecolumn-format-in/10720994
thumbnailImage: ../media/code-search-go-to-line-parentheses-thumbnail.png
title: 향상된 줄 & 열 탐색
description: 이제 Visual Studio는 코드 검색에서 고급 줄 및 열 탐색을 지원합니다.
area: Productivity
featureId: AllInOneSearchLineNavigationNewFormatSupport

---


[코드 검색](vscmd://Edit.NavigateTo)에서는 줄 탐색 기능이 크게 향상되었습니다. 이제 지원되는 파일 형식은 다음과 같습니다.

- `:line` 활성 문서에서 특정 줄로 이동하기
- `:line,col` 활성 문서에서 특정 줄과 열로 이동하기
- `file:line` 지정된 파일에서 특정 줄로 이동하기
- `file:line,col` 지정된 파일에서 특정 줄과 열로 이동하기
- `file(line)` 지정된 파일에서 특정 줄로 이동하기
- `file(line,col)` 지정된 파일에서 특정 줄과 열로 이동하기

![파일, 줄, 열로 이동하는 예시](../media/code-search-go-to-line-parentheses.png)

이러한 향상된 기능으로 코드를 더 쉽게 찾고 편집할 수 있으므로 생산성을 향상시키고 워크플로를 간소화할 수 있습니다.
