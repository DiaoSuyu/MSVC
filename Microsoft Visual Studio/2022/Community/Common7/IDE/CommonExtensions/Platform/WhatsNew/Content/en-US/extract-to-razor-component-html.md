---
devComUrl: https://github.com/dotnet/razor/issues/6187
thumbnailImage: ../media/extract-to-razor-component-thumbnail.png
title: Extract HTML to Razor component
description: Use a code action to easily extract HTML to a Razor component in Visual Studio.
area: Web
featureId: extract-to-razor-component-html

---


Have you ever found yourself adding too much code to a *.razor* file and wanted an easy way to move it to its own reusable component? When working with HTML in a Razor file, you can now use `CTRL+.` or right-click and select **Quick Actions and Refactorings** to automatically extract your selected HTML markup to a new Razor component in Visual Studio.

In this first iteration, the *Extract element to new component* feature is only supported with HTML markup selections. 

![Example of HTML markup being extracted to a new Razor component](../media/extract-to-razor-component.png)

This enhancement streamlines your workflow by allowing you to modularize your Razor components effortlessly.
