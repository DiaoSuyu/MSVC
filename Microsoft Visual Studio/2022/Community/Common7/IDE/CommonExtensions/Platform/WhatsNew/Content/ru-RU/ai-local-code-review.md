---
restartRequired: true
featureFlagName: Git.UX.ReviewPullRequest
devComUrl: https://developercommunity.visualstudio.com/t/Use-Copilot-to-review-commit/10575248?q=code+review
thumbnailImage: ../media/17.13p2_local_code_review.png
title: Выявление проблем во время фиксации
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EWl1PdajOx1ImPgEUYMxF9QBeXLkJ5J7dHCA0rb_-b8uBQ?e=Z3zWG3
tags: top-story
description: Предложения GitHub Copilot по внесенным в код изменениям помогут вам выявлять потенциальные проблемы на ранних этапах и повысить качество своего кода.
area: Git tooling
surveyUrl: https://aka.ms/LocalCodeReview
featureId: ailocalcodereview

---


Теперь GitHub Copilot может проводить проверку кода ваших локальных изменений даже до их фиксации! Если в Visual Studio включена подписка на Copilot и следующие флаги функций, в окне "Изменения Git" присутствует новая кнопка комментария с искрой. Если нажать эту кнопку, Copilot проанализирует ваш набор изменений и отобразит свои предложения прямо в редакторе кода.

![17.13P2 — кнопка просмотра локального кода](../media/17.13p2_local_code_review-button.png)

Модель может указать на критические проблемы, включая потенциальные проблемы с производительностью и безопасностью, ранее выявление которых снижает риск отправки проблемных изменений в удаленную базу кода.

![Комментарий по результатам проверки локального кода](../media/17.13p2_local_code_review.png)

Убедитесь, что у вас включены оба следующих флага функций:

- **Сервис** > **Параметры** > **Предварительные версии функций** > **Комментарии к запросу на вытягивание**
- **Сервис** > **Параметры** > **GitHub** > **Copilot** > **Интеграция системы управления версиями** > **Включить предварительные версии функций Git**.

### Хотите попробовать?
Активируйте GitHub Copilot Free и получите доступ к этой ИИ-функции, а также другие возомжности.
 Никаких пробных периодов. Не нужна кредитная карта. Только ваша учетная запись на GitHub. [Скачать Copilot Free](vscmd://View.GitHub.Copilot.Chat).
