---
restartRequired: true
featureFlagName: Shell.ThemeAgnosticFontSettings
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: Preservar preferências de fonte entre temas
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: Agora, a alteração dos temas preserva suas preferências de fonte e tamanho de fonte.
area: IDE
featureId: preserveFontAcrossThemes

---


Entendemos que as fontes que os desenvolvedores selecionam quando a codificação é uma escolha pessoal, influenciada por preferências de legibilidade, acessibilidade ou estética. Os temas do Visual Studio se concentram principalmente nas cores da apresentação e são independentes de suas fontes preferidas.

Com essa atualização, introduzimos a funcionalidade para manter o tipo de fonte e as opções de tamanho ao alternar temas. Agora você pode definir suas preferências de fonte uma vez e alternar temas no Visual Studio sem toda vez precisar redefinir suas configurações de fonte. Observe que as cores de suas fontes permanecem vinculadas ao tema, pois esse é o propósito dos temas, mas suas seleções de fontes serão preservadas.

![O editor do Visual Studio mostra a mesma parte do código usando a mesma fonte, mas metade do código está no tema escuro e metade no claro.](../media/FontAttributesPreserveAcrossThemes.png)

Esse recurso será habilitado por padrão para todos os usuários. Se preferir o comportamento anterior, vá para [Ferramentas > Gerenciar versões prévias de recursos](vscmd://Tools.ManagePreviewFeatures) e localize a opção **Separar as configurações de fonte da seleção de tema de cor**. Se essa opção estiver marcada, suas preferências de fonte serão mantidas independentemente das alterações do tema. Desmarque a caixa para restabelecer o comportamento anterior que vincula as opções de fonte ao tema.
