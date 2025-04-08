---
tags: top-story
featureFlagName: Git.UX.ReviewPullRequestAddComment
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdF1b2Q6ENlPtBi9sTug6CkBTewteQ9kiMuHpprvsaqmcw?e=Cr8rXF
thumbnailImage: ../media/17.13p1-add-pull-request-comments-thumbnail.png
title: プル リクエストにコメントを追加する
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-171-Git-Pull-Request-is-gone/1576559
surveyUrl: https://aka.ms/reviewPR
description: チェックアウトされたブランチのファイルに新しいコメントを追加することにより、Visual Studio でプル リクエストを確認します。
area: Git tooling
featureId: addprcomments

---


最新の更新により、チェックアウトされたブランチのプル リクエスト ファイルに新しいコメントを追加できるようになりました。 これはプル リクエスト エクスペリエンスについて最も要望の多かった機能であり、Visual Studio のプル リクエスト エクスペリエンスに対する一連の機能強化のうち最新のものです。

### 作業を開始する

**[プル リクエスト コメント]** および **[プリ リクエスト追加コメント]** の機能フラグを有効にし、アクティブなプル リクエストがあるブランチをチェックアウトして、情報バーの **[ファイルのコメントを表示する]** を選択します。 これにより、エディターでプル リクエスト コメント エクスペリエンスがアクティブ化されます。

![pull request コメント通知を表示する](../media/17.11p1-view-pull-request-comments-thumbnail.png)

ファイルに新しいコメントを追加するには、余白にある **[コメントの追加]** アイコンを選択するか、コメントを追加する行を右クリックして、コンテキスト メニューから **[Git > コメントを追加]** を選択します。

![プル リクエスト コメントの追加アイコン](../media/17.13p1-add-pull-request-comments-thumbnail.png)

注: アイコンは、プル リクエストの一部であるファイルにのみ表示されます。 GitHubのプルリクエストの場合、コメントできるのは、変更された行を囲む行と、変更された行を含む行のみです。
