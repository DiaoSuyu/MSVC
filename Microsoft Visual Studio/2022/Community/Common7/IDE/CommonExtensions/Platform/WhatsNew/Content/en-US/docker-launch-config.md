---
devComUrl: https://developercommunity.visualstudio.com/t/VS2022-not-debugging-docker-compose-when/10327484
thumbnailImage: ../media/docker.png
title: Launch a new Docker configuration
description: Enable depends_on support with the DependencyAwareStart launch configuration option.
area: Cloud
featureId: dockerlaunchconfig

---


We are excited to introduce a new launch configuration option called `DependencyAwareStart`. When set to `True`, this option changes how Docker Compose projects are launched, enabling the use of the `depends_on` directive in your Compose configuration.

![Docker Depends On](../media/docker-depends_on.png)

This feature ensures that specified containers are started in the correct order, adhering to the dependency requirements defined in your Docker Compose file. By managing dependencies more effectively, it enhances the robustness and reliability of multi-container applications.
