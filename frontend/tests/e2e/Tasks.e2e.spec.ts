import { test, expect, unico, emailUnico } from './support/fixtures'

test.describe('J08 — Tarefa concluída', () => {
  test('J08 #1 recusa reabrir tarefa concluída e mantém COMPLETED após recarregar', async ({
    page,
    dados
  }) => {
    // DEFEITO: Status sem rótulo acessível (RNF01); COMPLETED para PENDING é aceito e gravado (RN01/API05).
    test.fail(true, 'DEFEITO: RNF01 e transição COMPLETED para PENDING aceita (RN01/API05)')
    const usuario = await dados.criarUsuario({
      name: unico('Usuário J08'),
      email: emailUnico('j08')
    })
    const categoria = await dados.criarCategoria({
      name: unico('Categoria J08'),
      description: unico('Descrição J08')
    })
    const titulo = unico('Tarefa J08 concluída')
    await dados.criarTarefa({
      title: titulo,
      userId: usuario.id,
      categoryId: categoria.id,
      status: 'COMPLETED'
    })

    await page.goto('/tasks')
    const linha = page.getByRole('row').filter({ hasText: titulo })
    await expect(linha).toContainText('COMPLETED')
    await linha.getByRole('button', { name: 'Editar' }).click()
    await expect.soft(page.getByLabel('Status:')).toBeVisible()
    await page.getByRole('combobox').filter({ hasText: 'Concluída' }).selectOption('PENDING')
    await page.getByRole('button', { name: 'Atualizar' }).click()

    await expect.soft(linha).toContainText('COMPLETED')
    await page.reload()
    await expect.soft(page.getByRole('row').filter({ hasText: titulo })).toContainText('COMPLETED')
  })
})