---
devComUrl: https://github.com/dotnet/razor/issues/6187
thumbnailImage: ../media/extract-to-razor-component-thumbnail.png
title: Extrahování HTML do komponenty Razor
description: Snadná extrakce kódu HTML do komponenty Razor ve Visual Studiu pomocí akce kódu.
area: Web
featureId: extract-to-razor-component-html

---


Už se vám někdy stalo, že jste do souboru *.razor* přidali příliš mnoho kódu a chtěli jste ho snadno přesunout do vlastní opakovaně použitelné komponenty? Při práci s HTML v souboru Razor teď můžete použít `CTRL+.` nebo kliknout pravým tlačítkem myši a vybrat **Rychlé akce a refaktoring** k automatickému extrahování vybraného kódu HTML do nové komponenty Razor v sadě Visual Studio.

V této první iteraci je funkce *Extrakce prvku do nové komponenty* podporována pouze s výběry kódu HTML. 

![Příklad extrahování kódu HTML do nové komponenty Razor](../media/extract-to-razor-component.png)

Toto vylepšení zjednodušuje práci tím, že umožňuje snadno modularizovat komponenty Razor.
