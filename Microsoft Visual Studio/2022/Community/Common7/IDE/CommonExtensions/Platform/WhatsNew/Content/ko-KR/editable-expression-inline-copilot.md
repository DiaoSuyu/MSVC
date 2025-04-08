---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/Integrated-Linq-Editor/442398
thumbnailImage: ../media/editable-expression-copilot-thumbnail.png
title: 복잡한 LINQ 쿼리 만들기
specUrl: https://microsoft.sharepoint.com/:p:/t/VisualStudioProductTeam/ETycaBw7iJdFhgYRYWGSa34BXJEaakZ2PCrAWHmhkEbAsA?e=7hIYoO
description: IEnumerable 시각화 도우미에서 GitHub Copilot Inline Chat을 통해 직접 편집 가능한 식이 개선되었습니다.
area: Debugging & diagnostics
featureId: editable-expression-inline-copilot

---


IEnumerable 시각화 도우미가 편집 가능한 식에 대한 인라인 채팅 기능을 제공하게 되었습니다. 이를 통해 사용자는 IEnumerable 시각화 도우미 내에서 AI의 도움을 받아 편집 가능한 식에 대한 복잡한 LINQ 쿼리를 생성할 수 있습니다. 

![IEnumerable 시각화 도우미 인라인 채팅](../media/editable-expression-inline-copilot.mp4)

### 편집 가능한 식 인라인 채팅

인라인 채팅을 열려면, 편집 가능한 표현 텍스트 상자의 오른쪽 하단에 위치한 GitHub Copilot 스파클 버튼을 클릭하면 됩니다. 이렇게 하면 원래의 편집 가능한 표현 위에 텍스트 상자가 열리고, *현재 표현을 어떻게 수정할지 설명하세요*라는 메시지가 표시됩니다. 자연어로 요청을 입력하고 준비가 되면 **제출 버튼**을 클릭합니다.

입력된 내용을 토대로 GitHub Copilot이 LINQ 쿼리를 생성하며, 생성된 쿼리는 기본 설정에 따라 자동으로 실행됩니다. GitHub Copilot에서 생성된 LINQ 쿼리의 성공적인 생성 및 적용 여부는 녹색 확인 표시를 통해 확인할 수 있습니다. 해당 표시는 쿼리가 완전히 실행 및 적용되었음을 나타냅니다.

### GitHub Copilot Chat 계속하기
이 기능은 또한 GitHub Copilot에 의해 적어도 하나의 LINQ 쿼리가 생성된 후, 텍스트 상자의 오른쪽 상단에 편리하게 위치한 **채팅에서 계속** 버튼을 포함합니다. 

이 버튼을 클릭하면 쿼리 구체화, 후속 질문, 또는 다른 방식에 대한 자세한 정보 확인이 가능한 전용 GitHub Copilot Chat 창이 열립니다. 이번 통합으로 GitHub Copilot의 전체 기능을 이용하는 동시에 제어와 유연성을 유지할 수 있게 되었습니다.

![편집 가능한 식 인라인 GitHub Copilot](../media/editable-expression-copilot.png)

시각화 도우미로 돌아갈 준비가 되면 **시각화 도우미에서 표시 버튼**을 클릭하기만 하면 됩니다. 이렇게 하면 채팅 세션 에서 생성된 변경 내용을 보거나 적용할 수 있는 시각화 도우미 환경으로 원활하게 다시 전환할 수 있습니다.

이 기능은 비주얼라이저와 GitHub Copilot Chat 간의 원활한 워크플로를 제공합니다. 인라인 채팅은 빠른 편집과 작은 조정을 위해 최적화되어 있으며, GitHub Copilot 채팅은 더 자세한 수정과 반복적인 개선을 처리하는 데 뛰어납니다. 두 기능 모두 편집 가능한 표현에 대한 LINQ 쿼리 생성을 더 쉽고 효율적으로 만드는데 목적이 있습니다.

### 이 작업을 시도해 보시겠습니까?
GitHub Copilot Free를 활성화하고 이 AI 기능의 잠금을 해제합니다.
평가판 없음 신용카드 없음. 귀하의 GitHub 계정만. [Copilot Free 사용하기](vscmd://View.GitHub.Copilot.Chat).
