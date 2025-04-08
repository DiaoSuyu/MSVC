---
devComUrl: https://developercommunity.visualstudio.com/t/fix-scroll-bars/1087969
thumbnailImage: ../media/horizontal-scroll-bar-thumbnail.png
title: Přepracování vodorovného posuvníku
description: Vodorovný posuvník v editoru se teď může přemístit tak, aby byl vždy přístupný, i když je málo místa.
area: Productivity
featureId: EditorHorizontalScrollbarPersistence

---


Panel editoru ve Visual Studiu je cenný prostor umožňující přístup k řadě informací. Můžete ovládat lupu, zkontrolovat stav dokumentu, zjistit, na jakém řádku se nacházíte, a přistupovat k řadě dalších údajů.

Někdy ale všechny tyto informace mohou odsunout vodorovný posuvník, což ztěžuje posouvání v okně. To platí zejména v zobrazení vedle sebe, kde hlavní panel není příliš široký.

Tato nejnovější aktualizace tyto problémy řeší. Pokud šířka posuvníku poklesne pod určitou hranici, posuvník se přemístí nad hlavní panel systému, aby byl stále přístupný. Ve výchozím nastavení se pak vrátí na panel editoru, jakmile pro něj bude opět dostatek místa.

![Vodorovný posuvník zobrazený nad panelem editoru](../media/horizontal-scroll-bar-thumbnail.png)

I když se domníváme, že toto chování bude pro většinu uživatelů ideální, pokud narazíte na nějaké problémy, můžete je změnit pomocí nabídky **Nástroje > Možnosti**. Možnost se nachází v části **Textový editor > Upřesnit** a je označena jako **Umístění vodorovného posuvníku editoru**. Toto nastavení umožňuje zvolit, zda má posuvník měnit svoji polohu podle dostupného místa, zůstávat na panelu editoru nebo se vždy zobrazovat nad panelem editoru.

![Nastavení vodorovného posuvníku](../media/horizontal-scroll-bar-setting.png)
