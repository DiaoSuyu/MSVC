---
devComUrl: https://github.com/microsoft/DockerTools/issues/359
thumbnailImage: ../media/docker.png
title: Add scale to Docker Compose
description: The scale property in Docker Compose is now supported.
area: Cloud
featureId: dockercomposescale

---


You can now add the `scale` property to your Docker Compose service configuration to debug with a specific number of replicas running. For example, the configuration below will run two instances of the `webapi` service when launched.

![Docker Scale](../media/docker-scale.png)

This enhancement allows for more effective load testing and debugging of your applications by simulating a production-like environment. It also streamlines your workflow by making it easier to manage multiple instances directly from your Compose file. This feature is particularly useful for testing the behavior of your services under load and ensuring that your application can handle multiple instances seamlessly.
