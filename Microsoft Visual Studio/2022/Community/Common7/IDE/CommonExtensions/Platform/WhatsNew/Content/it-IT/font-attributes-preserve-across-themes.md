---
restartRequired: true
featureFlagName: Shell.ThemeAgnosticFontSettings
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: Preservare le preferenze dei tipi di carattere nei temi
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: La modifica dei temi preserva le preferenze dei tipi e delle dimensioni del carattere.
area: IDE
featureId: preserveFontAcrossThemes

---


Sappiamo che i tipi di carattere selezionati dagli sviluppatori durante la codifica sono una scelta personale, influenzata dalle preferenze di leggibilità, accessibilità o estetica. I temi di Visual Studio si concentrano principalmente sui colori della presentazione e sono indipendenti dai tipi di carattere preferiti.

Con questo aggiornamento, abbiamo introdotto una funzionalità che conserva le scelte relative all'aspetto e alle dimensioni del tipo di carattere quando si cambiano i temi. Ora è possibile impostare le preferenze relative ai tipi di carattere una sola volta, quindi cambiare tema in Visual Studio senza dover riconfigurare ogni volta le impostazioni del tipo di carattere. Si noti che i colori dei tipi di carattere rimangono collegati al tema, in quanto questo è lo scopo dei temi, ma le selezioni dei tipi di carattere verranno mantenute.

![Editor di Visual Studio che mostra la stessa parte di codice usando lo stesso tipo di carattere, ma metà del codice è in tema scuro e metà in chiaro.](../media/FontAttributesPreserveAcrossThemes.png)

Questa funzionalità verrà abilitata per impostazione predefinita per tutti gli utenti. Se si preferisce il comportamento precedente, andare a [Strumenti > Gestire funzionalità di anteprima](vscmd://Tools.ManagePreviewFeatures) e trovare l'opzione **Separare le impostazioni del tipo di carattere dalla selezione del tema di colori**. Se questa opzione è selezionata, le preferenze dei tipi di carattere verranno mantenute indipendentemente dalle modifiche al tema. Deselezionare la casella per ripristinare il comportamento precedente che collega le scelte dei tipi di carattere al tema.
