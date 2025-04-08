---
tags: top-story
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdF1b2Q6ENlPtBi9sTug6CkBTewteQ9kiMuHpprvsaqmcw?e=Cr8rXF
thumbnailImage: ../media/17.13p1-add-pull-request-comments-thumbnail.png
title: Add comments on pull requests
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-171-Git-Pull-Request-is-gone/1576559
surveyUrl: https://aka.ms/reviewPR
description: Review pull requests in Visual Studio by adding new comments to the files on the checked-out branch.
area: Git tooling
featureId: addprcomments

---


With the latest update, you can now add new comments to pull request files on the checked-out branch. This was a top request for the pull request experience and is the latest in a series of improvements to the pull request experience in Visual Studio.

### Get Started

Enable the feature flags **Pull Request Comments** and **Pull Request Add Comment**, check out any branch with an active pull request, and select **Show comments in files** in the InfoBar. This will activate the pull request comments experience in the editor.

![View pull request comments notification](../media/17.11p1-view-pull-request-comments-thumbnail.png)

To add a new comment to a file, select the **Add Comment** icon in the margin, or right-click the line you'd like to add a comment on and choose **Git > Add Comment** from the context menu.

![Add pull request comment icon](../media/17.13p1-add-pull-request-comments-thumbnail.png)

Note: The icon will show only in files that are part of the pull request. For GitHub pull requests, you'll only be able to comment on lines surrounding and including the lines that have been changed.
