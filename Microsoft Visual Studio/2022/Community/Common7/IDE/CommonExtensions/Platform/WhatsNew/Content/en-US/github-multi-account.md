---
devComUrl: https://developercommunity.visualstudio.com/t/Multiple-github-user-accounts/10195369
thumbnailImage: ../media/github-active-badge.png
title: Manage multiple GitHub accounts
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EfdJkRBfnmlHkCUlVgfrV_0BbA7B7ISqppWmOPkihdR1cw?e=MIBCab
description: Add multiple GitHub accounts and set an active account to drive GitHub features like GitHub Copilot and version control.
area: IDE
featureId: GitHubMultiAccount

---


Do you need to use different GitHub accounts for your development scenarios? Visual Studio now allows you to have multiple GitHub accounts at the same time!

### Adding multiple GitHub accounts
Adding multiple accounts is easy! Simply open the profile card, select **Add another account**, sign in to your GitHub account, and repeat as needed.

![Profile card with multiple GitHub accounts](../media/github-profilecard.png)

You can also add your accounts from the Account Settings dialog under **File > Account Settings**.

### Setting an active GitHub account

If you add multiple GitHub accounts, Visual Studio will default to the one marked as *active* for GitHub aware features, such as version control and GitHub Copilot. 

To switch the active account, access the account options and select the **Set as active account** button.

![Setting the GitHub active account](../media/github-setasactive.png)


### Impact to GitHub Copilot
Copilot activates automatically when the active GitHub account is subscribed to either GitHub Copilot for Individuals or GitHub Copilot for Business.

### Impact to version control

When working on GitHub pull requests or issues, you'll get a prompt to set your GitHub account. We'll remember your preferences whenever you work on a particular repository, so when you change repositories, you won't have to worry about switching your accounts for your regular Git operations like push, pull, and fetch. You'll also get prompted to update your active account if there's ever a mismatch to avoid using the wrong account.

### Want to try this out?
Activate GitHub Copilot Free and unlock this AI feature, plus many more.
No trial. No credit card. Just your GitHub account. [Get Copilot Free](vscmd://View.GitHub.Copilot.Chat).
