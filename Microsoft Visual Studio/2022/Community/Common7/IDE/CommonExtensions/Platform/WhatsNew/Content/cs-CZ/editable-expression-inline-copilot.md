---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/Integrated-Linq-Editor/442398
thumbnailImage: ../media/editable-expression-copilot-thumbnail.png
title: Vytváření složitých dotazů LINQ
specUrl: https://microsoft.sharepoint.com/:p:/t/VisualStudioProductTeam/ETycaBw7iJdFhgYRYWGSa34BXJEaakZ2PCrAWHmhkEbAsA?e=7hIYoO
description: Vylepšený upravitelný výraz s vloženým chatem funkce GitHub Copilot přímo v vizualizéru IEnumerable.
area: Debugging & diagnostics
featureId: editable-expression-inline-copilot

---


Vizualizér IEnumerable teď obsahuje vložený chat pro upravitelný výraz, který uživatelům umožňuje využívat AI přímo v rámci vizualizéru IEnumerable k vytváření složitých dotazů LINQ pro upravitelný výraz. 

![Vložený chat vizualizéru IEnumerable](../media/editable-expression-inline-copilot.mp4)

### Vložený chat upravitelného výrazu

Chcete-li vyvolat vložený chat, jednoduše klikněte na tlačítko s jiskrou GitHub Copilot v pravém dolním rohu textového pole upravitelného výrazu. Tím otevřete nad původním upravitelným výrazem textové pole s výzvou *Popište, jak chcete aktuální výraz upřesnit*. Zadejte požadavek v přirozeném jazyce a až budete připraveni, klikněte na **tlačítko Odeslat**.

GitHub Copilot vygeneruje dotaz LINQ na základě vašeho zadání a ve výchozím nastavení ho automaticky spustí. Pokud chcete ověřit, že se dotaz úspěšně vygeneroval a použil, vyhledejte zelenou značku zaškrtnutí, která značí, že dotaz LINQ vygenerovaný GitHub Copilotem byl plně proveden a použit.

### Pokračovat na chat GitHub Copilotu
Tato funkce také po vygenerování aspoň jednoho dotazu LINQ pomocí GitHub Copilotu nabízí tlačítko **Pokračovat v chatu**, které je pohodlně umístěné v pravém horním rohu textového pole. 

Po kliknutí na toto tlačítko se otevře vyhrazené okno chatu funkce GitHub Copilot, kde můžete dotaz upřesnit, položit další otázky nebo podrobněji prozkoumat alternativní přístupy. Tato integrace zaručuje zachování kontroly a flexibility při současném využití všech možností GitHub Copilotu.

![Vložený upravitelný výraz GitHub Copilotu](../media/editable-expression-copilot.png)

Až se budete chtít vrátit do vizualizéru, jednoduše klikněte na tlačítko **Zobrazit ve vizualizéru** . Můžete tak hladce přejít zpět do prostředí vizualizéru a zobrazit si nebo použít změny vygenerované během relace chatu.

Tato funkce umožňuje během práce plynule přecházet mezi vizualizérem a chatem GitHub Copilotu. Vložený chat vizualizéru je optimalizovaný s ohledem na rychlé a drobné úpravy, zatímco chat GitHub Copilotu vyniká při práci na podrobnějších a iterativních vylepšeních. Oba jsou zaměřeny na to, aby generování dotazů LINQ pro upravitelný výraz bylo snadnější a efektivnější.

### Chcete to vyzkoušet?
Aktivujte nástroj GitHub Copilot Free a odemkněte tuto funkci využívající umělou inteligenci a mnoho dalších.
 Žádná zkušební verze. Žádná platební karta. Jen váš účet GitHub. [Získejte nástroj Copilot Free](vscmd://View.GitHub.Copilot.Chat).
