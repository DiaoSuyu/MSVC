---
devComUrl: https://developercommunity.visualstudio.com/t/fix-scroll-bars/1087969
thumbnailImage: ../media/horizontal-scroll-bar-thumbnail.png
title: Rediseño de la barra de desplazamiento horizontal
description: La barra de desplazamiento horizontal del editor ahora se puede recolocar para estar siempre accesible, incluso cuando el espacio es limitado.
area: Productivity
featureId: EditorHorizontalScrollbarPersistence

---


La bandeja del editor en Visual Studio es un espacio valioso para una gran cantidad de información. Puede controlar el zoom, comprobar el estado del documento, ver en qué línea está y acceder a información adicional variada.

Desafortunadamente, a veces toda esa información puede desplazar la barra de desplazamiento horizontal, dificultando el desplazamiento por la ventana. Esto es especialmente así en una vista en paralelo en la que la bandeja del sistema no es muy amplia.

Con esta última actualización, estos problemas son cosa del pasado. Si la barra de desplazamiento cae por debajo de un ancho utilizable, se recolocará sobre la bandeja del sistema para garantizar que siempre esté disponible. Por defecto, volverá a la bandeja del editor en cuanto vuelva a haber espacio suficiente.

![Barra de desplazamiento horizontal, mostrada encima de la bandeja del editor](../media/horizontal-scroll-bar-thumbnail.png)

Aunque creemos que este comportamiento será ideal para la mayoría de los usuarios, si encuentra algún problema, puede controlar el comportamiento en **Herramientas > Opciones**. La opción se encuentra en **Editor de texto > Avanzadas** y se llama **Ubicación de barra de desplazamiento horizontal de editor**. Esta configuración le permite elegir si desea que la barra de desplazamiento ajuste su posición según el espacio disponible, permanezca en la bandeja del editor o aparezca siempre encima de la bandeja del editor.

![Configuración de barra de desplazamiento horizontal](../media/horizontal-scroll-bar-setting.png)
