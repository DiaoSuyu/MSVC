---
devComUrl: 
thumbnailImage: ../media/editable-expression-syntax-highlight-thumbnail.png
title: IEnumerable Visualizer で構文を強調表示する
specUrl: https://devdiv.visualstudio.com/DevDiv/_workitems/edit/2253294
description: 構文の強調表示により編集可能な式が見やすくなりました。
area: Debugging & diagnostics
featureId: editable-expression-syntax-highlight

---


LINQ 式の記述は難しい場合があり、複雑になれば特に見づらくなります。 Visual Studio 2022 では、**IEnumerable Visualizer の編集可能な式**に**構文の強調表示**が導入されました。

構文の強調表示では、クラス、列挙型、デリゲート、構造体、キーワードなど、クエリの特定の部分に別々の色が適用されます。 これにより、LINQ 式のさまざまなコンポーネントを簡単に見つけて、論理フローを一目で確認できるため、より明確で保守しやすいコードになります。

![IEnumerable Visualizer での構文の強調表示](../media/editable-expression-syntax-highlighting.png)

### 構文の強調表示をカスタマイズする

Visual Studio では、好みに合わせて色分けをカスタマイズできます。 色分けをカスタマイズするには:

1. **[ツール] > [オプション] > [環境] > [フォントおよび色]** の順に選択します。
2. **[設定の表示]** ドロップダウンの **[テキスト エディター]** を選択します。
3. **[ユーザー タイプ]** の各項目の色を、コーディング スタイルに合わせて調整します。
