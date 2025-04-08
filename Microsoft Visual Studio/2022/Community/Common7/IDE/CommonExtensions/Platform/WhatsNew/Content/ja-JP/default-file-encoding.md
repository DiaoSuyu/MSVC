---
tags: top-story
devComUrl: https://developercommunity.visualstudio.com/t/utf-8-save-as-without-signature-default-request-to/787476
thumbnailImage: ../media/default-file-encoding-thumbnail.png
title: ファイル エンコードをカスタマイズする
specUrl: https://microsoft.sharepoint.com/:w:/t/VisualStudioProductTeam/ESOumqZDXABBpSHpExZWdDgB-uKOrxCDuTjA5Hk8ab1Ddg?e=iYfVep
description: Visual Studio でファイルを保存するための既定のエンコードを指定します。
area: Productivity
featureId: DefaultFileEncoding

---


クロスプラットフォーム環境で作業する Developers は、多くの場合、特定のファイル エンコーディングでファイルを保存する必要があります。 これらのエンコードを変更すると、さまざまな問題が発生する可能性があります。

Visual Studio では、ファイルを保存するための既定のファイル エンコードを設定できるようになりました。 この機能により、可能な限り優先エンコードが使用されます。

既定のエンコードを設定するには、 **[ツール] > [オプション] > [環境] > [ドキュメント]** に移動します。 そこでは、 **特定のエンコードでファイルを保存する**というタイトルのオプションがあります。 このオプションをオフにすると、Visual Studio は既定の動作を使用してファイルのエンコードを管理します。 オンにすると、ファイルが保存されるたびに、隣接するコンボ ボックスで指定されたエンコードが Visual Studio によって使用されます。

![[ツール]\[オプション] の既定のファイル エンコード オプション](../media/default-file-encoding.png)

指定したエンコード (Unicode 文字を含むファイルに対する *ASCII* エンコードの要求など) で Visual Studio を保存できない場合は、問題を通知するダイアログが表示されます。
