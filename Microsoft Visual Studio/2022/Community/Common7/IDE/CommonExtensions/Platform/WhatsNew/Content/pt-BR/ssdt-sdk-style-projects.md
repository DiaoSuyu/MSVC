---
devComUrl: https://developercommunity.visualstudio.com/t/Use-new-project-file-format-for-sqlproj/480461
thumbnailImage: ../media/ssdt-thumbnail.png
title: Usar projetos de SQL no estilo SDK no SSDT
specUrl: https://techcommunity.microsoft.com/t5/azure-sql-blog/preview-release-of-sdk-style-sql-projects-in-visual-studio-2022/ba-p/4240616
description: Agora você pode usar o formato de arquivo de projeto no estilo SDK em seus projetos do SQL Server Data Tools com recursos aprimorados de depuração de SQL e comparação de esquemas.
area: Data
featureId: ssdt-sdk

---


A atualização no Visual Studio 17.13 introduz a comparação de esquemas, a comparação de dados, referências de projeto e a depuração de SQL para o SQL Server Data Tools (versão preliminar) no estilo SDK. Os projetos SQL do SSDT no estilo SDK são baseados no Microsoft.Build.Sql SDK, que oferece suporte entre plataformas e recursos aprimorados de CI/CD para projetos do SQL Server Data Tools (SSDT).

![Comparação de esquemas em SQL Server Data Tools no estilo SDK](../media/ssdt_preview_schemacompare.png)

Na versão preliminar 3 do 17.13, a comparação de esquemas é limitada a comparações de bancos de dados e .dacpac; a comparação de projetos SQL ainda não está disponível. Agora, as referências de banco de dados estão disponíveis como referências de projeto na versão prévia 3, sendo que o suporte para referências de banco de dados como referências dacpac e referências de pacote será disponibilizado em uma versão futura. Uma versão recente do [gerador de arquivos de solução slngen](https://github.com/microsoft/slngen) também adicionou suporte para projetos Microsoft.Build.Sql, permitindo o gerenciamento de grandes soluções por programação.

Além disso, o designer de tabelas e outras opções de script foram aprimorados no Pesquisador de Objetos do SQL Server. Saiba mais sobre como usar o depurador de SQL para investigar o código T-SQL complexo em ambientes de desenvolvimento na seção [documentação](https://learn.microsoft.com/sql/ssdt/debugger/transact-sql-debugger).

Com arquivos de projeto menos detalhados e referências de banco de dados a pacotes NuGet, as equipes podem colaborar com mais eficiência em bancos de dados grandes em um único projeto ou compilar vários conjuntos de objetos de vários projetos. As implantações de banco de dados de um projeto do Microsoft.Build.Sql podem ser automatizadas em ambientes Windows e Linux em que a ferramenta dotnet do Microsoft.SqlPackage publica o artefato de compilação (.dacpac) do projeto SQL. Saiba mais sobre [Projetos SQL no estilo SDK e DevOps para SQL](https://aka.ms/sqlprojects).

Certifique-se de instalar o componente de versão prévia do SSDT mais recente no instalador do Visual Studio para usar os projetos SQL no estilo SDK em sua solução.

![O instalador habilita o recurso SSDT da versão prévia](../media/ssdt_preview_installer.png)
