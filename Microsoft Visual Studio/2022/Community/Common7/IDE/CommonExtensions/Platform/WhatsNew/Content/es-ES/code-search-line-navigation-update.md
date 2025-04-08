---
devComUrl: https://developercommunity.visualstudio.com/t/Support-Filenamelinecolumn-format-in/10720994
thumbnailImage: ../media/code-search-go-to-line-parentheses-thumbnail.png
title: Navegación mejorada de líneas y columnas
description: Visual Studio ahora admite la navegación avanzada por líneas y columnas en Búsqueda de código.
area: Productivity
featureId: AllInOneSearchLineNavigationNewFormatSupport

---


En [Búsqueda de código](vscmd://Edit.NavigateTo), hemos mejorado significativamente las funcionalidades de navegación por líneas. Ahora se admiten los siguientes formatos:

- `:line` para ir a una línea concreta del documento activo
- `:line,col` para ir a una línea y una columna concretas en el documento activo
- `file:line` para ir a una línea específica de un archivo concreto
- `file:line,col` para ir a una línea y columna específicas de un archivo concreto
- `file(line)` para ir a una línea específica de un archivo concreto
- `file(line,col)` para ir a una línea y columna específicas de un archivo concreto

![Ejemplo que muestra cómo ir al archivo, la línea y la columna](../media/code-search-go-to-line-parentheses.png)

Estas mejoras facilitan la localización y edición rápidas del código, lo que mejora la productividad y optimiza el flujo de trabajo.
