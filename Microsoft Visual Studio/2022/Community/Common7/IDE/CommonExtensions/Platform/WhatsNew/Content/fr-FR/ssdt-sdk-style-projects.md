---
devComUrl: https://developercommunity.visualstudio.com/t/Use-new-project-file-format-for-sqlproj/480461
thumbnailImage: ../media/ssdt-thumbnail.png
title: Utilisez des projets SQL de type SDK dans SSDT
specUrl: https://techcommunity.microsoft.com/t5/azure-sql-blog/preview-release-of-sdk-style-sql-projects-in-visual-studio-2022/ba-p/4240616
description: Vous pouvez désormais utiliser le format de fichier de projet de style SDK dans vos projets SQL Server Data Tools avec des fonctionnalités de débogage SQL et de comparaison de schémas améliorées.
area: Data
featureId: ssdt-sdk

---


La mise à jour dans Visual Studio 17.13 introduit la comparaison de schémas, la comparaison de données, les références de projet et le débogage SQL dans les outils de données SQL Server de style SDK (aperçu). Les projets SQL SSDT de style SDK sont basés sur le SDK Microsoft.Build.Sql, ce qui apporte une prise en charge multiplateforme et améliore les fonctionnalités CI/CD pour les projets SQL Server Data Tools (SSDT).

![Comparer les schémas dans SQL Server Data Tools de style SDK](../media/ssdt_preview_schemacompare.png)

Dans la version 17.13 preview 3, la comparaison de schémas est limitée aux comparaisons de base de données et .dacpac ; la comparaison de projets SQL n’est pas encore disponible. Les références de base de données sont désormais disponibles en tant que références de projet dans la version 3. La prise en charge des références de base de données en tant que références dacpac et références de package sera disponible dans une prochaine version. Une version récente du générateur de [fichiers de solution slngen](https://github.com/microsoft/slngen) a également ajouté la prise en charge des projets Microsoft.Build.Sql, ce qui permet de gérer de grandes solutions par programme.

En outre, le concepteur de tables et d’autres options de script ont été améliorés dans l’Explorateur d’objets SQL Server. En savoir plus sur l’utilisation du débogueur SQL pour examiner le code T-SQL complexe dans les environnements de développement à partir de la [documentation](https://learn.microsoft.com/sql/ssdt/debugger/transact-sql-debugger).

Avec des fichiers de projet moins verbeux et des références de base de données vers des packages NuGet, les équipes peuvent collaborer plus efficacement sur de grandes bases de données dans un seul projet ou compiler plusieurs ensembles d’objets à partir de plusieurs projets. Les déploiements de base de données à partir d’un projet Microsoft.Build.Sql peuvent être automatisés dans des environnements Windows et Linux où l’outil dotnet Microsoft.SqlPackage publie l’artifact de build (.dacpac) du projet SQL. Pour en savoir plus sur les [projets SQL de style SDK et DevOps pour SQL](https://aka.ms/sqlprojects).

Assurez-vous d’installer la dernière version Preview du composant SSDT dans l’installateur Visual Studio pour utiliser les projets SQL au format SDK dans votre solution.

![Installer activer la fonctionnalité Preview SSDT](../media/ssdt_preview_installer.png)
