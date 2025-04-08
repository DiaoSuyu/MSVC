---
restartRequired: true
featureFlagName: Git.UX.ReviewPullRequest
devComUrl: https://developercommunity.visualstudio.com/t/Use-Copilot-to-review-commit/10575248?q=code+review
thumbnailImage: ../media/17.13p2_local_code_review.png
title: Detección de problemas en el momento de la confirmación
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EWl1PdajOx1ImPgEUYMxF9QBeXLkJ5J7dHCA0rb_-b8uBQ?e=Z3zWG3
tags: top-story
description: Obtenga sugerencias basadas en GitHub Copilot para los cambios de código para ayudarle a detectar posibles problemas al principio y mejorar la calidad del código.
area: Git tooling
surveyUrl: https://aka.ms/LocalCodeReview
featureId: ailocalcodereview

---


Ahora, puede obtener una revisión del código de GitHub Copilot en los cambios locales antes de incluso confirmarlo. Con la suscripción de Copilot habilitada en Visual Studio y las siguientes marcas de características habilitadas, puede ver el nuevo botón de comentario resaltado en la ventana Cambios de Git. Al hacer clic en él, Copilot examinará los conjuntos de cambios y propondrá algunas sugerencias insertadas en el editor.

![17.13P2 Botón de revisión de código local](../media/17.13p2_local_code_review-button.png)

El modelo puede señalar problemas críticos, como posibles problemas de rendimiento y seguridad que, cuando se detectan al principio, ayudan a reducir el riesgo de insertar problemas en la base de código remota.

![Comentario de revisión de código local](../media/17.13p2_local_code_review.png)

Asegúrese de que tiene activadas las dos marcas de características siguientes:

- **Herramientas** > **Opciones** > **Vista previa de características** > **Comentarios de solicitud de incorporación de cambios**
- **Herramientas** > **Opciones** > **GitHub** > **Copilot** > **Integración de control de origen** > **Habilitar características de vista previa de Git**.

### ¿Quiere probarlo?
Active GitHub Copilot Free y descubra esta característica de IA, además de muchas más.
 Sin pruebas. Sin tarjeta de crédito. Tan solo su cuenta de GitHub. [Obtenga Copilot Free](vscmd://View.GitHub.Copilot.Chat).
