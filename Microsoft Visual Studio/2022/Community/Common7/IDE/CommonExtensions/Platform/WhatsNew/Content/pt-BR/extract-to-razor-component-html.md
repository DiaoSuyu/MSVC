---
devComUrl: https://github.com/dotnet/razor/issues/6187
thumbnailImage: ../media/extract-to-razor-component-thumbnail.png
title: Extrair HTML para o componente Razor
description: Use uma ação de código para extrair facilmente o HTML para um componente Razor no Visual Studio.
area: Web
featureId: extract-to-razor-component-html

---


Você já se pegou adicionando muito código a um arquivo *.razor* e queria uma maneira fácil de movê-lo para seu próprio componente reutilizável? Ao trabalhar com HTML em um arquivo Razor, agora você pode usar `CTRL+.` ou clicar com o botão direito do mouse e selecionar **Ações Rápidas e Refatorações** para extrair automaticamente a marcação HTML selecionada para um novo componente Razor no Visual Studio.

Nesta primeira iteração, o *Extrair elemento para novo componente* só é suportado com seleções de marcação HTML. 

![Exemplo de marcação HTML sendo extraída para um novo componente Razor](../media/extract-to-razor-component.png)

Esse aprimoramento agiliza seu fluxo de trabalho, permitindo que você modularize seus componentes Razor sem esforço.
