---
devComUrl: https://developercommunity.visualstudio.com/t/fix-scroll-bars/1087969
thumbnailImage: ../media/horizontal-scroll-bar-thumbnail.png
title: Reformule a barra de rolagem horizontal
description: Agora, a barra de rolagem horizontal no editor pode se reposicionar para estar sempre acessível, mesmo quando o espaço é limitado.
area: Productivity
featureId: EditorHorizontalScrollbarPersistence

---


A bandeja do editor no Visual Studio é um espaço valioso para uma grande quantidade de informações. É possível controlar o zoom, verificar a integridade do documento, ver em que linha você está e acessar várias informações adicionais.

Infelizmente, às vezes, todas essas informações podem ocupar a barra de rolagem horizontal, dificultando a rolagem pela janela. Isso é verdadeiro especialmente em uma exibição lado a lado, onde a bandeja do sistema não é muito larga.

Com essa atualização mais recente, essas dificuldades são coisa do passado. Se a barra de rolagem ficar abaixo de uma largura utilizável, ela se reposicionará acima da bandeja do sistema para garantir que esteja sempre acessível. Por padrão, ele retornará à bandeja do editor assim que houver espaço suficiente para ele novamente.

![A barra de rolagem horizontal, exibida acima da bandeja do editor](../media/horizontal-scroll-bar-thumbnail.png)

Embora acreditemos que esse comportamento seja ideal para a maioria dos usuários, se você encontrar algum problema, poderá controlar o comportamento em **Ferramentas > Opções**. A opção fica localizada em **Editor de Texto > Avançado** e está rotulado como **Localização da barra de rolagem horizontal do editor**. Essa configuração permite que você escolha se a barra de rolagem ajustará sua posição de acordo com o espaço disponível, se permanecerá na bandeja do editor ou se sempre aparecerá acima da bandeja do editor.

![Configuração da barra de rolagem horizontal](../media/horizontal-scroll-bar-setting.png)
