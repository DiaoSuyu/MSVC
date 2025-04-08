---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/Integrated-Linq-Editor/442398
thumbnailImage: ../media/editable-expression-copilot-thumbnail.png
title: Criar consultas LINQ complexas
specUrl: https://microsoft.sharepoint.com/:p:/t/VisualStudioProductTeam/ETycaBw7iJdFhgYRYWGSa34BXJEaakZ2PCrAWHmhkEbAsA?e=7hIYoO
description: Expressão editável aprimorada com o GitHub Copilot Inline Chat diretamente no IEnumerable Visualizer.
area: Debugging & diagnostics
featureId: editable-expression-inline-copilot

---


O IEnumerable Visualizer agora apresenta chat embutido para sua expressão editável, permitindo que os usuários aproveitem a IA diretamente no IEnumerable Visualizer para criar consultas LINQ complexas para a expressão editável. 

![Chat embutido do IEnumerable Visualizer](../media/editable-expression-inline-copilot.mp4)

### Chat embutido de expressão editável

Para abrir o chat em linha, basta clicar no botão de brilho do GitHub Copilot localizado no canto inferior direito da caixa de texto da expressão editável. Isso abrirá uma caixa de texto acima da expressão editável original, com um prompt que diz *Descreva como você deseja refinar sua expressão atual*. Insira sua solicitação em linguagem natural e, quando estiver pronto, clique no **botão Enviar**.

O GitHub Copilot gerará uma consulta LINQ com base na sua entrada e a executará automaticamente por padrão. Para confirmar se a consulta foi gerada e aplicada com êxito, procure a marca de seleção verde, que indica que a consulta LINQ gerada pelo GitHub Copilot foi totalmente executada e aplicada.

### Continue para o chat do GitHub Copilot
O recurso também inclui um botão **Continuar no chat** depois que pelo menos uma consulta LINQ tiver sido gerada pelo GitHub Copilot, convenientemente localizado no canto superior direito da caixa de texto. 

Ao clicar nesse botão, uma janela dedicada do chat do GitHub Copilot será aberta, onde você poderá refinar sua consulta, fazer perguntas de acompanhamento ou explorar abordagens alternativas com mais detalhes. Essa integração garante que você mantenha o controle e a flexibilidade enquanto aproveita todos os recursos do GitHub Copilot.

![Expressão editável embutido ao GitHub Copilot](../media/editable-expression-copilot.png)

Quando estiver pronto para retornar ao visualizador, basta clicar no botão **Mostrar no visualizador** . Isso permite que você faça a transição perfeita de volta para o ambiente do visualizador, onde pode visualizar ou aplicar as alterações geradas durante a sessão de chat.

Esse recurso fornece um fluxo de trabalho fluido entre o visualizador e o GitHub Copilot Chat. O chat em linha é otimizado para edições rápidas e pequenos ajustes, enquanto o GitHub Copilot Chat é excelente para lidar com refinamentos mais detalhados e melhorias iterativas, ambos com o objetivo de tornar a geração de consultas LINQ para expressões editáveis mais fácil e eficiente.

### Quer experimentar?
Ative o GitHub Copilot Free e desbloqueie esse recurso de IA, além de muito mais.
 Sem trials. Sem cartão de crédito. Apenas sua conta do GitHub. [Obtenha o Copilot Free](vscmd://View.GitHub.Copilot.Chat).
