---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: Personalización de la codificación de archivos
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: Especifique la codificación predeterminada para guardar archivos en Visual Studio.
area: Productivity
featureId: DefaultFileEncoding

---


Los desarrolladores que trabajan en entornos multiplataforma a menudo necesitan guardar archivos con codificaciones de archivos específicas. El cambio de estas codificaciones puede provocar varios problemas.

Visual Studio ahora permite establecer la codificación de archivos predeterminada para guardar archivos. Esta característica garantiza que la codificación preferida se use siempre que sea posible.

Para establecer la codificación predeterminada, vaya a **Herramientas > Opciones > Entorno > Documentos**. Allí encontrará una opción denominada **Guardar archivos con una codificación específica**. Si esta opción no está marcada, Visual Studio administrará la codificación de archivos usando su comportamiento predeterminado. Si está activada, Visual Studio usará la codificación especificada en el cuadro combinado adyacente cada vez que se guarde un archivo.

![La opción de codificación de archivos predeterminada se encuentra en Herramientas\Opciones](../media/default-file-encoding.png)

Si Visual Studio no puede guardar con la codificación especificada (por ejemplo, solicitar la codificación *ASCII* para un archivo que contenga caracteres Unicode), mostrará un cuadro de diálogo que le informa del problema.
