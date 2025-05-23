---
devComUrl: https://developercommunity.visualstudio.com/t/Multiple-github-user-accounts/10195369
thumbnailImage: ../media/github-active-badge.png
title: Управление несколькими учетными записями GitHub
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EfdJkRBfnmlHkCUlVgfrV_0BbA7B7ISqppWmOPkihdR1cw?e=MIBCab
description: Добавьте несколько учетных записей GitHub и настройте активную учетную запись для использования функций GitHub, таких как GitHub Copilot и управление версиями.
area: IDE
featureId: GitHubMultiAccount

---


Вам нужно использовать разные учетные записи GitHub для сценариев разработки? Теперь в Visual Studio можно использовать несколько учетных записей GitHub одновременно.

### Добавление нескольких учетных записей GitHub
Добавить несколько учетных записей очень просто. Откройте карточку профиля, выберите **Добавить другую учетную запись**, войдите в свою учетную запись GitHub, затем повторите эти действия нужное количество раз.

![Карточка профиля с несколькими учетными записями GitHub](../media/github-profilecard.png)

Также можно добавить учетные записи в диалоговом окне "Параметры учетной записи" в разделе **Файл > Параметры учетной записи**.

### Настройка активной учетной записи GitHub

При добавлении нескольких учетных записей GitHub служба Visual Studio по умолчанию будет использоваться с той, которая помечена как *активная*, для применения функций, учитывающих GitHub, например управление версиями и Copilot. 

Чтобы переключить активную учетную запись, перейдите к параметрам учетной записи и нажмите кнопку **Задать как активную учетную запись**.

![Настройка активной учетной записи GitHub](../media/github-setasactive.png)


### Влияние на GitHub Copilot

Copilot активируется автоматически, когда активная учетная запись GitHub оформляет подписку на GitHub Copilot для отдельных пользователей или на GitHub Copilot для бизнеса.

### Влияние на управление версиями

При работе с запросами на вытягивание или проблемами GitHub вы получите запрос на настройку учетной записи GitHub. Мы запомним ваши предпочтения при работе с определенным репозиторием, поэтому при изменении репозиториев вам не придется беспокоиться о переключении учетных записей для обычных операций Git, таких как отправка, вытягивание и получение. Вы также получите запрос на обновление активной учетной записи, если когда-либо возникает несоответствие, чтобы избежать использования неправильной учетной записи.

### Хотите попробовать?
Активируйте GitHub Copilot Free и получите доступ к этой ИИ-функции, а также другие возомжности.
 Никаких пробных периодов. Не нужна кредитная карта. Только ваша учетная запись на GitHub. [Скачать Copilot Free](vscmd://View.GitHub.Copilot.Chat).
