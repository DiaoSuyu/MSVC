---
restartRequired: true
featureFlagName: Shell.ThemeAgnosticFontSettings
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: Conservación de las preferencias de fuente entre temas
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: El cambio de temas ahora conserva las preferencias de tamaño de fuente y fuente.
area: IDE
featureId: preserveFontAcrossThemes

---


Entendemos que las fuentes que eligen los desarrolladores a la hora de programar son una elección personal, influida por preferencias de legibilidad, accesibilidad o estética. Los temas de Visual Studio se centran principalmente en los colores de presentación y son independientes de sus fuentes preferidas.

Con esta actualización, hemos introducido la funcionalidad para conservar el aspecto de la fuente y las opciones de tamaño al cambiar de tema. Ahora puede establecer las preferencias de fuente una vez y cambiar los temas en Visual Studio sin necesidad de volver a configurar la configuración de fuente cada vez. Tenga en cuenta que los colores de las fuentes permanecen vinculados al tema, ya que es el propósito de los temas, pero se conservarán las selecciones de fuentes.

![El editor de Visual Studio que muestra el mismo fragmento de código con la misma fuente, pero la mitad del código está en el tema oscuro y la mitad en claro.](../media/FontAttributesPreserveAcrossThemes.png)

Esta función estará habilitada de forma predeterminada para todos los usuarios. Si prefiere el comportamiento anterior, vaya a [Herramientas > Administrar características en vista previa](vscmd://Tools.ManagePreviewFeatures) y busque la opción **Separar la configuración de fuente de la selección de tema de color**. Si esta opción está activada, las preferencias de fuente se mantendrán independientemente de los cambios de tema. Desactive la casilla para restablecer el comportamiento anterior que vincula las opciones de fuente al tema.
