---
devComUrl: 
thumbnailImage: ../media/editable-expression-syntax-highlight-thumbnail.png
title: Realçar a sintaxe com IEnumerable Visualizer
specUrl: https://devdiv.visualstudio.com/DevDiv/_workitems/edit/2253294
description: A expressão editável aprimorada com realce de sintaxe já está disponível.
area: Debugging & diagnostics
featureId: editable-expression-syntax-highlight

---


Escrever expressões LINQ pode ser complicado, principalmente à medida que elas se tornam cada vez mais complexas. O Visual Studio 2022 apresenta agora o **realce de sintaxe** na **Expressão Editável do IEnumerable Visualizer**.

O realce de sintaxe aplica cores diferentes a partes específicas de suas consultas, como classes, enumerações, delegados, estruturas e palavras-chave. Isto faz com que seja mais simples identificar vários componentes em suas expressões LINQ e ter uma visão geral do fluxo lógico, levando a um código mais claro e fácil de manter.

![Realce de sintaxe do IEnumerable Visualizer](../media/editable-expression-syntax-highlighting.png)

### Personalizar o realce de sintaxe

O Visual Studio permite que personalizar o esquema de cores para se adequar às suas preferências. Para personalizar suas cores:

1. Acesse **Ferramentas > Opções > Ambiente > Fontes e Cores**.
2. Selecione **Editor de Texto** na lista suspensa **Mostrar configurações de**.
3. Ajuste a cor de cada item de **Tipos de Usuário** para coincidir com seu estilo de codificação.
