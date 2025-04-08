---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: Přizpůsobení kódování souborů
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: Zadejte výchozí kódování pro ukládání souborů ve Visual Studiu.
area: Productivity
featureId: DefaultFileEncoding

---


Vývojáři pracující v prostředích napříč platformami často potřebují ukládat soubory s určitým kódováním. Změna těchto kódování může vést k různým problémům.

Visual Studio nyní umožňuje nastavit výchozí kódování souborů pro ukládání. Tato funkce zajišťuje, aby se ve všech případech, kdy je to možné, používalo upřednostňované kódování.

Pokud chcete nastavit výchozí kódování, přejděte na **Nástroje > Možnosti > Prostředí > Dokumenty**. Tam najdete možnost **Ukládat soubory s určitým kódováním**. Pokud tato možnost není zaškrtnutá, Visual Studio použije ke správě kódování souborů výchozí chování. Pokud je zaškrtnutá, Visual Studio použije při každém ukládání souboru kódování zadané v sousedním poli se seznamem.

![Výchozí možnost kódování souborů v nabídce Nástroje\Možnosti](../media/default-file-encoding.png)

Pokud Visual Studio nemůže soubor uložit se zadaným kódováním (například pokud se požaduje kódování *ASCII* pro soubor obsahující znaky Unicode), zobrazí se dialogové okno informující o problému.
