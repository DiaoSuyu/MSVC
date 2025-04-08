---
devComUrl: https://github.com/dotnet/razor/issues/6187
thumbnailImage: ../media/extract-to-razor-component-thumbnail.png
title: HTML を Razor コンポーネントに抽出する
description: コード アクションを使用して、Visual Studio の Razor コンポーネントに HTML を簡単に抽出できるようになりました。
area: Web
featureId: extract-to-razor-component-html

---


*.razor* ファイルに追加するコードが多すぎて、再利用できる独自のコンポーネントに簡単に移動したいと思ったことはありませんか?  Razor ファイルで HTML を操作する場合、`CTRL+.` を使用するか、右クリックして **[クイック アクションとリファクタリング]** を選択すると、選択した HTML マークアップが Visual Studio の新しい Razor コンポーネントに自動的に抽出されるようになりました。

この最初の反復では、 *要素を新しいコンポーネントに抽出* 機能は、HTML マークアップ選択でのみサポートされます。 

![新しい Razor コンポーネントに抽出される HTML マークアップの例](../media/extract-to-razor-component.png)

この機能強化により、Razor コンポーネントを簡単にモジュール化できるため、ワークフローが合理化されます。
