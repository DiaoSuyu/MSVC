---
devComUrl: 
thumbnailImage: ../media/editable-expression-syntax-highlight-thumbnail.png
title: Resaltado de sintaxis con el visualizador IEnumerable
specUrl: https://devdiv.visualstudio.com/DevDiv/_workitems/edit/2253294
description: Ya está disponible la expresión editable mejorada con resaltado de sintaxis.
area: Debugging & diagnostics
featureId: editable-expression-syntax-highlight

---


Escribir expresiones LINQ puede resultar complicado, sobre todo a medida que se hacen más complejas. Visual Studio 2022 ahora presenta el **resaltado de sintaxis** en la **expresión editable del visualizador IEnumerable**.

El resaltado de sintaxis aplica colores diferentes a partes específicas de las consultas, como clases, enumeraciones, delegados, estructuras y palabras clave. De este modo, resulta sencillo detectar los distintos componentes de las expresiones LINQ y ver el flujo lógico de un vistazo, lo que permite obtener un código más claro y fácil de mantener.

![Resaltado de sintaxis del visualizador IEnumerable](../media/editable-expression-syntax-highlighting.png)

### Personalización del resaltado de sintaxis

Visual Studio le permite personalizar el esquema de colores para adaptarlo a sus preferencias. Para personalizar los colores:

1. Vaya a **Herramientas > Opciones > Entorno > Fuentes y colores**.
2. Seleccione **Editor de texto** en la lista desplegable **Mostrar valores para**.
3. Ajuste el color de cada elemento de **Tipos de usuario** para que coincida con el estilo de codificación.
