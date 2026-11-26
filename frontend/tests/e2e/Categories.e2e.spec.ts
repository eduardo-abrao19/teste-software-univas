import { test, expect, unico, emailUnico } from './support/fixtures'

test.describe('J05 — Cadastro, edição e exclusão de categoria', () => {
  test('J05 #1 cadastra categoria e mantém os dados após recarregar', async ({ page, dados }) => {
    // DEFEITO: os campos de categoria não têm rótulos associados, contrariando RNF01.
    test.fail(true, 'DEFEITO: campos de categoria sem associação acessível aos rótulos (RNF01)')
    const nome = unico('Categoria J05 nova')
    const descricao = unico('Descrição J05 nova')

    await page.goto('/categories')
    await page.getByRole('button', { name: 'Adicionar Categoria' }).click()
    const campoNome = page.getByLabel('Nome:')
    await expect.soft(campoNome).toBeVisible()
    if (!(await campoNome.isVisible())) return
    await campoNome.fill(nome)
    await page.getByLabel('Descrição:').fill(descricao)
    await page.getByRole('button', { name: 'Criar' }).click()
    await dados.registrarCategoriaPorNome(nome)

    const linha = page.getByRole('row').filter({ hasText: nome })
    await expect(linha).toContainText(descricao)
    await expect(page.getByRole('button', { name: 'Criar' })).toBeHidden()

    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nome })).toContainText(descricao)
  })

  test('J05 #2 edita Nome e Descrição e mantém a alteração após recarregar', async ({
    page,
    dados
  }) => {
    // DEFEITO: os campos de categoria não têm rótulos associados, contrariando RNF01.
    test.fail(true, 'DEFEITO: campos de categoria sem associação acessível aos rótulos (RNF01)')
    const nomeAnterior = unico('Categoria J05 anterior')
    const descricaoAnterior = unico('Descrição J05 anterior')
    const novoNome = unico('Categoria J05 atualizada')
    const novaDescricao = unico('Descrição J05 atualizada')
    await dados.criarCategoria({ name: nomeAnterior, description: descricaoAnterior })

    await page.goto('/categories')
    const linha = page.getByRole('row').filter({ hasText: nomeAnterior })
    await expect(linha).toContainText(descricaoAnterior)
    await linha.getByRole('button', { name: 'Editar' }).click()
    const campoNome = page.getByLabel('Nome:')
    await expect.soft(campoNome).toBeVisible()
    if (!(await campoNome.isVisible())) return
    await campoNome.fill(novoNome)
    await page.getByLabel('Descrição:').fill(novaDescricao)
    await page.getByRole('button', { name: 'Atualizar' }).click()

    const linhaAtualizada = page.getByRole('row').filter({ hasText: novoNome })
    await expect(linhaAtualizada).toContainText(novaDescricao)
    await expect(linhaAtualizada).not.toContainText(nomeAnterior)
    await expect(linhaAtualizada).not.toContainText(descricaoAnterior)

    await page.reload()
    const linhaRecarregada = page.getByRole('row').filter({ hasText: novoNome })
    await expect(linhaRecarregada).toContainText(novaDescricao)
    await expect(linhaRecarregada).not.toContainText(nomeAnterior)
    await expect(linhaRecarregada).not.toContainText(descricaoAnterior)
  })

  test('J05 #3 confirma exclusão de categoria e mantém ausência após recarregar', async ({
    page,
    dados
  }) => {
    const nome = unico('Categoria J05 excluir')
    await dados.criarCategoria({ name: nome, description: unico('Descrição J05 excluir') })

    await page.goto('/categories')
    const linha = page.getByRole('row').filter({ hasText: nome })
    await expect(linha).toBeVisible()
    page.once('dialog', dialog => dialog.accept())
    await linha.getByRole('button', { name: 'Excluir' }).click()

    await expect(linha).toBeHidden()
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nome })).toBeHidden()
  })

  test('J05 #4 cancela exclusão de categoria e mantém registro após recarregar', async ({
    page,
    dados
  }) => {
    const nome = unico('Categoria J05 manter')
    const descricao = unico('Descrição J05 manter')
    await dados.criarCategoria({ name: nome, description: descricao })

    await page.goto('/categories')
    const linha = page.getByRole('row').filter({ hasText: nome })
    await expect(linha).toBeVisible()
    page.once('dialog', dialog => dialog.dismiss())
    await linha.getByRole('button', { name: 'Excluir' }).click()

    await expect(linha).toContainText(descricao)
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nome })).toContainText(descricao)
  })
})
test.describe('J06 — Categoria em uso', () => {
  test('J06 #1 impede excluir categoria em uso e preserva registro após recarregar', async ({
    page,
    dados
  }) => {
    const usuario = await dados.criarUsuario({
      name: unico('Usuário J06'),
      email: emailUnico('j06')
    })
    const nomeCategoria = unico('Categoria J06 em uso')
    const categoria = await dados.criarCategoria({
      name: nomeCategoria,
      description: unico('Descrição J06')
    })
    await dados.criarTarefa({
      title: unico('Tarefa J06'),
      userId: usuario.id,
      categoryId: categoria.id
    })

    await page.goto('/categories')
    const linha = page.getByRole('row').filter({ hasText: nomeCategoria })
    await expect(linha).toBeVisible()
    page.once('dialog', dialog => dialog.accept())
    await linha.getByRole('button', { name: 'Excluir' }).click()

    await expect(page.getByText(/erro/i)).toBeVisible()
    await expect(linha).toBeVisible()
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nomeCategoria })).toBeVisible()
  })
})