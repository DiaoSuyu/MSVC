---
devComUrl: https://github.com/microsoft/DockerTools/issues/359
thumbnailImage: ../media/docker.png
title: Aggiungere Scale a Docker Compose
description: La proprietà Scale in Docker Compose è ora supportata.
area: Cloud
featureId: dockercomposescale

---


È ora possibile aggiungere la proprietà `scale` alla configurazione del servizio Docker Compose per eseguire il debug con un numero specifico di repliche in esecuzione. Ad esempio, la configurazione seguente eseguirà due istanze del servizio `webapi` all'avvio.

![Scala di Docker](../media/docker-scale.png)

Questo miglioramento consente di eseguire test di carico e debug delle applicazioni più efficaci simulando un ambiente simile alla produzione. Semplifica inoltre il flusso di lavoro rendendo più efficiente la gestione di più istanze direttamente dal file Compose. Questa funzionalità è particolarmente utile per testare il comportamento dei servizi sotto carico e assicurarsi che l'applicazione sia in grado di gestire facilmente più istanze.
