---
devComUrl: 
thumbnailImage: ../media/editable-expression-syntax-highlight-thumbnail.png
title: Zvýraznění syntaxe s vizualizérem IEnumerable
specUrl: https://devdiv.visualstudio.com/DevDiv/_workitems/edit/2253294
description: Nyní je k dispozici vylepšený upravitelný výraz se zvýrazněním syntaxe.
area: Debugging & diagnostics
featureId: editable-expression-syntax-highlight

---


Psaní výrazů LINQ může být náročné, zejména pokud jsou víc a víc složitější. Visual Studio 2022 teď zavádí **zvýrazňování syntaxe** v **editovatelném výrazu vizualizéru IEnumerable**.

Zvýraznění syntaxe používá různé barvy na konkrétní části dotazů, jako jsou třídy, výčty, delegáty, struktury a klíčová slova. Díky tomu je jednoduché odhalit různé komponenty ve výrazech LINQ a na první pohled vidět logický tok, což má za výsledek srozumitelnější a lépe udržovatelný kód.

![Zvýraznění syntaxe vizualizéru IEnumerable](../media/editable-expression-syntax-highlighting.png)

### Přizpůsobení zvýraznění syntaxe

Visual Studio umožňuje přizpůsobit barevné schéma tak, aby vyhovovalo vašim preferencím. Přizpůsobení barev:

1. Přejděte do nabídky **Nástroje > Možnosti > Prostředí > Písma a barvy**.
2. Vyberte položku **Textový editor** v rozevíracím seznamu **Zobrazit nastavení pro**.
3. Upravte barvu jednotlivých položek **Typy uživatelů** tak, aby odpovídala vašemu stylu kódování.
