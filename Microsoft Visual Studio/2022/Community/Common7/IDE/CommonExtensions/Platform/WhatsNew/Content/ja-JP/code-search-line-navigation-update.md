---
devComUrl: https://developercommunity.visualstudio.com/t/Support-Filenamelinecolumn-format-in/10720994
thumbnailImage: ../media/code-search-go-to-line-parentheses-thumbnail.png
title: 拡張された行 & 列のナビゲーション
description: Visual Studio で、コード検索での高度な行と列のナビゲーションがサポートされるようになりました。
area: Productivity
featureId: AllInOneSearchLineNavigationNewFormatSupport

---


[Code Search](vscmd://Edit.NavigateTo)では、行ナビゲーション機能が大幅に強化されました。 現在、次の形式がサポートされています。

- `:line`: アクティブなドキュメント内の特定の行に移動します
- `:line,col`: アクティブなドキュメント内の特定の行と列に移動します
- `file:line`: 特定ファイル内の特定行に移動します
- `file:line,col`: 特定ファイル内の特定の行と列に移動します
- `file(line)`: 特定ファイル内の特定行に移動します
- `file(line,col)`: 特定ファイル内の特定の行と列に移動します

![ファイル、行、列へのナビゲーションを示す例](../media/code-search-go-to-line-parentheses.png)

これらの機能強化により、コードをすばやく見つけて編集しやすくなり、生産性が向上し、ワークフローが合理化されます。
