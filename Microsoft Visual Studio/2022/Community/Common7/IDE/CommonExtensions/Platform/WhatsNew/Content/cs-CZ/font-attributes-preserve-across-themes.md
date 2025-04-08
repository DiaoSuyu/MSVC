---
restartRequired: true
featureFlagName: Shell.ThemeAgnosticFontSettings
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: Zachování předvoleb písma napříč motivy
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: Změna motivů nyní zachová vaše předvolby písma a velikosti písma.
area: IDE
featureId: preserveFontAcrossThemes

---


Chápeme, že výběr písma při kódování je osobní volbou vývojářů, která je ovlivněna preferencemi týkající se čitelnosti, přístupnosti nebo estetiky. Motivy sady Visual Studio se primárně zaměřují na barvy prezentace a jsou nezávislé na upřednostňovaných písmech.

V této aktualizaci jsme zavedli funkce, které při přepínání motivů zachovávají vaši volbu typu a velikosti písma. Nyní můžete jednou nastavit předvolby písma a přepínat motivy v sadě Visual Studio, aniž byste museli pokaždé znovu konfigurovat nastavení písma. Všimněte si, že barvy písma zůstanou propojené s motivem, protože to je účel motivů, ale výběry písma se zachovají.

![Editor sady Visual Studio, který zobrazuje stejnou část kódu se stejným písmem, ale polovina kódu je v tmavém a polovina ve světlém motivu.](../media/FontAttributesPreserveAcrossThemes.png)

Tato funkce bude ve výchozím nastavení povolená pro všechny uživatele. Pokud dáváte přednost předchozímu chování, přejděte na [Nástroje > Spravovat funkce Preview](vscmd://Tools.ManagePreviewFeatures) a vyhledejte možnost **Oddělit nastavení písma od výběru barevného motivu**. Pokud je tato možnost zaškrtnutá, vaše předvolby písma se zachovají bez ohledu na změny motivu. Zrušením zaškrtnutí políčka obnovíte předchozí chování, které spojuje volby písma s motivem.
