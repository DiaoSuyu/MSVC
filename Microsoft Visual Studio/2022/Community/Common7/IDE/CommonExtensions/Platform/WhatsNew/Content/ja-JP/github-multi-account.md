---
devComUrl: https://developercommunity.visualstudio.com/t/Multiple-github-user-accounts/10195369
thumbnailImage: ../media/github-active-badge.png
title: 複数の GitHub アカウントを追加する
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EfdJkRBfnmlHkCUlVgfrV_0BbA7B7ISqppWmOPkihdR1cw?e=MIBCab
description: 複数の GitHub アカウントを追加し、アクティブなアカウントを設定して、GitHub Copilot やバージョン管理などの GitHub の機能を活用できるようになりました。
area: IDE
featureId: GitHubMultiAccount

---


開発シナリオ用に別の GitHub アカウントを使う必要がありますか。 Visual Studio では、複数の GitHub アカウントを同時に使用できるようになりました。

### 複数の GitHub アカウントの追加
複数のアカウントを追加するのは簡単です。 プロファイル カードを開き、**[別のアカウントを追加]** を選択して、GitHub アカウントにサインインするのを、必要に応じて繰り返すだけです。

![複数の GitHub アカウントを持つプロファイル カード](../media/github-profilecard.png)

**[ファイル] > [アカウントの設定...]** で [アカウント設定] ダイアログからアカウントを追加することもできます。

### アクティブな GitHub アカウントの設定

複数の GitHub アカウントを追加した場合、Visual Studio は、*アクティブ*とマークされているものを、バージョン管理や GitHub Copilot などの GitHub 対応機能に対する既定のアカウントにします。 

アクティブなアカウントを切り替えるには、アカウント オプションにアクセスして、**[アクティブなアカウントとして設定]** ボタンを選択します。

![GitHub のアクティブなアカウントの設定](../media/github-setasactive.png)


### GitHub Copilot への影響

Copilot は、アクティブな GitHub アカウントが GitHub Copilot for Individuals または GitHub Copilot for Business のいずれかに登録されると、自動的にアクティブになります。

### バージョン管理への影響

GitHub の pull request または issue の作業を行っている場合は、GitHub アカウントの設定を求めるメッセージが表示されます。 ユーザーが特定のリポジトリで作業しているときは常に、ユーザー設定が記憶されているため、リポジトリを変更しても、プッシュ、プル、フェッチなどの通常の Git 操作のためのアカウントの切り替えを心配する必要はありません。 また、間違ったアカウントの使用を防ぐため、不一致がある場合は、ユーザーはアクティブなアカウントの更新を求められます。

### さっそくこれを試してみましょう。
GitHub Copilot Free をアクティブ化し、この AI 機能のロックを解除します。
 試用版なし。 クレジット カード不可。 GitHub アカウントだけでいいのです。 [Copilotを無料でゲットしよう](vscmd://View.GitHub.Copilot.Chat)。
