---
devComUrl: https://developercommunity.visualstudio.com/t/Environment-font-and-font-size-is-associ/10143502?q=font+theme&fTime=allTime
thumbnailImage: ../media/FontAttributesPreserveAcrossThemes.png
title: Preserve font preferences across themes
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/EdXTo_GWzBpIrDv7ZyGrhKcB3arasI3DbQjrMXGs8StHtQ?e=8sPGnd
description: Changing themes will now preserve your font and font size preferences.
area: IDE
featureId: preserveFontAcrossThemes

---


We understand that the fonts developers select when coding is a personal choice, influenced by preferences for readability, accessibility, or aesthetics. Visual Studio themes primarily focus on presentation colors and are independent of your preferred fonts.

With this update, we've introduced functionality to retain your font face and size choices when switching themes. You can now set your font preferences once and switch themes in Visual Studio without needing to reconfigure your font settings every time. Note that the colors of your fonts remain linked to the theme, as that is the purpose of themes, but your font selections will be preserved.

![The Visual Studio editor showing the same piece of code using the same font, but half of the code is in dark theme and half in light.](../media/FontAttributesPreserveAcrossThemes.png)

This feature will be enabled by default for all users. If you prefer the previous behavior, go to [Tools > Manage Preview Features](vscmd://Tools.ManagePreviewFeatures) and find the option **Separate font settings from color theme selection**. If this option is checked, your font preferences will be maintained regardless of theme changes. Uncheck the box to reinstate the previous behavior which ties font choices to theme.
