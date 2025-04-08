---
restartRequired: true
featureFlagName: Git.UX.ReviewPullRequest
devComUrl: https://developercommunity.visualstudio.com/t/Use-Copilot-to-review-commit/10575248?q=code+review
thumbnailImage: ../media/17.13p2_local_code_review.png
title: Catch issues at commit time
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EWl1PdajOx1ImPgEUYMxF9QBeXLkJ5J7dHCA0rb_-b8uBQ?e=Z3zWG3
tags: top-story
description: Get GitHub Copilot-powered suggestions for your code changes to help you catch potential issues early and improve your code quality.
area: Git tooling
surveyUrl: https://aka.ms/LocalCodeReview
featureId: ailocalcodereview

---


Now, you can get a GitHub Copilot code review on your local changes before you even commit! With your Copilot subscription enabled in Visual Studio and the following feature flags enabled, you can see the new sparkle comment button in the Git Changes window. When clicked, Copilot will examine your sets of changes and propose some suggestions inline in your editor.

![17.13P2 Local Code Review Button](../media/17.13p2_local_code_review-button.png)

The model can point out critical issues such as potential performance and security problems that, when caught early, help reduce your risk of pushing issues into your remote code base.

![Local code review comment](../media/17.13p2_local_code_review.png)

Ensure you have both of the following feature flags turned on:

- **Tools** > **Options** > **Preview Features** > **Pull Request Comments**
- **Tools** > **Options** > **GitHub** > **Copilot** > **Source Control Integration** > **Enable Git preview features**.

### Want to try this out?
Activate GitHub Copilot Free and unlock this AI feature, plus many more.
No trial. No credit card. Just your GitHub account. [Get Copilot Free](vscmd://View.GitHub.Copilot.Chat).
