---
restartRequired: true
featureFlagName: Git.UX.ReviewPullRequest
devComUrl: https://developercommunity.visualstudio.com/t/Use-Copilot-to-review-commit/10575248?q=code+review
thumbnailImage: ../media/17.13p2_local_code_review.png
title: 커밋 시 문제 catch
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EWl1PdajOx1ImPgEUYMxF9QBeXLkJ5J7dHCA0rb_-b8uBQ?e=Z3zWG3
tags: top-story
description: 잠재적인 문제를 미리 파악하고 코드 품질을 개선하기 위해 코드 변경에 대한 GitHub Copilot 기반 제안을 가져옵니다.
area: Git tooling
surveyUrl: https://aka.ms/LocalCodeReview
featureId: ailocalcodereview

---


이제, 커밋을 하기 전에 GitHub Copilot을 통해 로컬에서 변경된 내용에 대한 코드 검토를 받아볼 수 있습니다. Visual Studio에서 Copilot 구독이 활성화되고, 다음 기능 플래그가 활성화되면 Git 변경 사항 창에서 새로운 스파클 주석 버튼을 볼 수 있습니다. 클릭하면, Copilot이 변경 사항 집합을 분석하고 편집기 내에서 몇 가지 제안을 인라인으로 제공합니다.

![17.13P2 로컬 코드 검토 버튼](../media/17.13p2_local_code_review-button.png)

모델은 성능 및 보안 문제와 같은 중요한 문제를 지적할 수 있으며, 이러한 문제를 조기에 발견하면 원격 코드 베이스에 문제를 푸시할 위험을 줄이는 데 도움이 됩니다.

![로컬 코드 검토 의견](../media/17.13p2_local_code_review.png)

다음 두 가지 기능 플래그가 모두 활성화되어 있는지 확인하세요.

- **도구** > **옵션** > **미리 보기 기능** > **끌어오기 요청 주석**
- **도구** > **옵션** > **GitHub** > **Copilot** > **소스 제어 통합** > **Git 미리 보기 기능 활성화**.

### 이 작업을 시도해 보시겠습니까?
GitHub Copilot Free를 활성화하고 이 AI 기능의 잠금을 해제합니다.
평가판 없음 신용카드 없음. 귀하의 GitHub 계정만. [Copilot Free 사용하기](vscmd://View.GitHub.Copilot.Chat).
