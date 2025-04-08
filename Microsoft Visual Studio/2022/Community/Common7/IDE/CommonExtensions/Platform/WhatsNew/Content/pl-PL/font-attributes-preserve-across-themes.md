---
restartRequired: true
featureFlagName: Shell.ThemeAgnosticFontSettings
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: Zachowywanie preferencji czcionek między motywami
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: Zmiana motywu nie będzie powodowała zmiany preferencji dotyczących czcionki i jej rozmiaru.
area: IDE
featureId: preserveFontAcrossThemes

---


Rozumiemy, że czcionki wybierane przez deweloperów w trakcie kodowania są ich osobistym wyborem, na który mają wpływ preferencje dotyczące czytelności, ułatwień dostępu lub estetyki. Motywy programu Visual Studio koncentrują się przede wszystkim na kolorach prezentacji i nie zależą od preferowanych czcionek.

Dzięki tej aktualizacji wprowadziliśmy funkcje, które umożliwiają zachowanie opcji wyglądu czcionki i jej rozmiaru podczas przełączania motywów. Teraz możesz ustawić preferencje czcionki raz i przełączać motywy w programie Visual Studio bez konieczności ponownego konfigurowania ustawień czcionki za każdym razem. Należy pamiętać, że kolory czcionek pozostają połączone z motywem, ponieważ taki jest cel motywów, ale wybory dotyczące samej czcionki zostaną zachowane.

![Edytor programu Visual Studio przedstawiający ten sam fragment kodu przy użyciu tej samej czcionki, ale połowa kodu znajduje się w motywie ciemnym, a druga połowa w jasnym.](../media/FontAttributesPreserveAcrossThemes.png)

Ta funkcja zostanie domyślnie włączona dla wszystkich użytkowników. Jeśli wolisz poprzednie zachowanie, przejdź do obszaru [Narzędzia > Zarządzaj funkcjami w wersji zapoznawczej](vscmd://Tools.ManagePreviewFeatures) i znajdź opcję **Oddziel ustawienia czcionki od wyboru motywu kolorów**. Jeśli ta opcja jest zaznaczona, preferencje dotyczące czcionki będą zachowywane niezależnie od zmian motywu. Usuń zaznaczenie pola, aby przywrócić poprzednie zachowanie, które wiąże wybór czcionek z motywem.
