# Inspira

Site estático de frases motivacionais publicado com GitHub Pages. A cada visita, uma frase é escolhida sem repetir a última exibida naquele navegador; o botão **Outra frase** permite sortear novamente.

## Atualização diária

O workflow `.github/workflows/publish.yml` roda diariamente às 03:00 UTC e também pode ser iniciado manualmente em **Actions → Atualizar frases e publicar no GitHub Pages → Run workflow**. Ele atualiza `quotes.json` a partir de `data/quotes_catalog.json`, registra a alteração no repositório e publica o site.

Para acrescentar frases, edite o catálogo com itens contendo um `id` único e o texto em `text`.

## Publicação

O GitHub Pages usa a origem **GitHub Actions**. Depois do primeiro push, acompanhe a execução na aba **Actions**; a URL do site fica em **Settings → Pages**.
