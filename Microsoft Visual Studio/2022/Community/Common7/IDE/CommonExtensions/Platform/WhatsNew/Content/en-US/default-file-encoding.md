---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: Customize file encoding
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: Specify the default encoding for saving files in Visual Studio.
area: Productivity
featureId: DefaultFileEncoding

---


Developers working in cross-platform environments often need files to be saved with specific file encodings. Changing these encodings can lead to various issues.

Visual Studio now allows you to set the default file encoding for saving files. This feature ensures that your preferred encoding is used whenever possible.

To set the default encoding, navigate to **Tools > Options > Environment > Documents**. There, you will find an option titled **Save files with a specific encoding**. If this option is unchecked, Visual Studio will manage file encoding using its default behavior. If checked, Visual Studio will use the encoding specified in the adjacent combo box whenever a file is saved.

![The default file encoding option in Tools\Options](../media/default-file-encoding.png)

If Visual Studio cannot save with the specified encoding (e.g., requesting *ASCII* encoding for a file containing Unicode characters), it will display a dialog informing you of the issue.
