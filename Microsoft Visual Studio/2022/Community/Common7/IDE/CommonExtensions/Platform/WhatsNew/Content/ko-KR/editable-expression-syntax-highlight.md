---
devComUrl: 
thumbnailImage: ../media/editable-expression-syntax-highlight-thumbnail.png
title: IEnumerable Visualizer로 구문 강조 표시
specUrl: https://devdiv.visualstudio.com/DevDiv/_workitems/edit/2253294
description: 이제 구문 강조 표시가 적용된 편집 가능한 표현식이 제공됩니다.
area: Debugging & diagnostics
featureId: editable-expression-syntax-highlight

---


LINQ 표현식을 작성하는 것은 특히 복잡해질수록 까다로울 수 있습니다. Visual Studio 2022에서는 **IEnumerable 시각화 도구 편집 가능 식**에 **구문 강조**를 도입했습니다.

구문 강조는 클래스, 열거형, 대리자, 구조체, 키워드 등 쿼리의 특정 부분에 서로 다른 색상을 적용합니다. 이를 통해 LINQ 표현식의 다양한 구성 요소를 쉽게 식별하고 논리적 흐름을 한눈에 파악할 수 있어 더 명확하고 유지 관리가 용이한 코드를 작성할 수 있습니다.

![IEnumerable 시각화 도구의 구문 강조](../media/editable-expression-syntax-highlighting.png)

### 구문 강조 표시 사용자화

Visual Studio에서는 선호에 맞게 색상 구성을 사용자 정의할 수 있습니다. 색상을 입맛에 맞게 설정하려면 다음을 수행하세요:

1. **도구 > 옵션 > 환경 > 글꼴 및 색**으로 이동합니다.
2. **설정 표시** 드롭다운에서 **텍스트 편집기**를 선택하세요.
3. 각 **사용자 유형** 항목의 색상을 조정하여 코딩 스타일에 맞게 설정합니다.
