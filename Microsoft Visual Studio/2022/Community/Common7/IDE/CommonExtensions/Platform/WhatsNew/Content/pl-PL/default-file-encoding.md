---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: Dostosowywanie kodowania plików
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: Określ domyślne kodowanie zapisywania plików w programie Visual Studio.
area: Productivity
featureId: DefaultFileEncoding

---


Deweloperzy pracujący w środowiskach międzyplatformowych często muszą zapisywać pliki z określonymi kodowaniami plików. Zmiana tych kodowań może prowadzić do różnych problemów.

Program Visual Studio umożliwia teraz ustawienie domyślnego kodowania plików na potrzeby zapisywania plików. Funkcja zapewnia, że preferowane kodowanie jest używane zawsze, gdy jest to możliwe.

Aby ustawić kodowanie domyślne, przejdź do **Narzędzia > Opcje > Środowisko > Dokumenty**. W tym miejscu znajdziesz opcję **Zapisz pliki z określonym kodowaniem**. Jeśli ta opcja nie jest zaznaczona, program Visual Studio użyje domyślnego schematu do kodowania plików. Jeśli to pole jest zaznaczone, program Visual Studio będzie używać kodowania określonego w sąsiednim polu kombi za każdym razem, gdy plik zostanie zapisany.

![Domyślna opcja kodowania plików w obszarze Narzędzia\Opcje](../media/default-file-encoding.png)

Jeśli program Visual Studio nie może zapisać pliku przy użyciu określonego kodowania (np. *ASCII* dla pliku zawierającego znaki Unicode), zostanie wyświetlone okno dialogowe z informacją o problemie.
