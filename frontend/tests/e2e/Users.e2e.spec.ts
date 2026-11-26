import { test, expect, unico, emailUnico } from './support/fixtures'
test.describe('J02 — Cadastro de usuário', () => {
  test('cria um usuário pela tela e ele continua na lista após recarregar', async ({
    page,
    dados
  }) => {
    const nomePreexistente = unico('J02 preexistente')
    const emailPreexistente = emailUnico('j02-pre')
    const nomeCriado = unico('J02 criado')
    const email = emailUnico('j02')
    await dados.criarUsuario({ name: nomePreexistente, email: emailPreexistente })
    await page.goto('/users')
    await expect(page.getByRole('row').filter({ hasText: emailPreexistente })).toContainText(nomePreexistente)
    await page.getByRole('button', { name: 'Adicionar Usuário' }).click()
    await page.getByLabel('Nome:').fill(nomeCriado)
    await page.getByLabel('Email:').fill(email)
    await page.getByRole('button', { name: 'Criar' }).click()
    await dados.registrarUsuarioPorEmail(email)
    await expect(page.getByRole('button', { name: 'Criar' })).toBeHidden()
    const linha = page.getByRole('row').filter({ hasText: email })
    await expect(linha).toContainText(nomeCriado)
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible()
  })
})

test.describe('J03 — Edição de usuário', () => {
  test('J03 #1 edita o nome do usuário e mantém a alteração após recarregar', async ({
    page,
    dados
  }) => {
    const nomeAnterior = unico('Usuário J03 anterior')
    const novoNome = unico('Usuário J03 atualizado')
    const email = emailUnico('j03')

    // Arrange: preparar pela API um usuário independente deste teste.
    await dados.criarUsuario({ name: nomeAnterior, email })

    // Act: localizar o usuário pelo email e editar seu nome pela interface.
    await page.goto('/users')
    const linha = page.getByRole('row').filter({ hasText: email })
    await expect(linha).toContainText(nomeAnterior)
    await linha.getByRole('button', { name: 'Editar' }).click()
    await page.getByLabel('Nome:').fill(novoNome)
    await page.getByRole('button', { name: 'Atualizar' }).click()

    // Assert: o novo nome aparece e o anterior deixa de aparecer na linha.
    await expect(linha).toContainText(novoNome)
    await expect(linha).not.toContainText(nomeAnterior)

    // Persistência: recarregar e confirmar o mesmo resultado vindo do banco.
    await page.reload()
    const linhaRecarregada = page.getByRole('row').filter({ hasText: email })
    await expect(linhaRecarregada).toContainText(novoNome)
    await expect(linhaRecarregada).not.toContainText(nomeAnterior)
  })
})
test.describe('J04 — Exclusão de usuário', () => {
  test('J04 #1 confirma exclusão e mantém ausência após recarregar', async ({ page, dados }) => {
    const nome = unico('Usuário J04 excluir')
    const email = emailUnico('j04-excluir')
    await dados.criarUsuario({ name: nome, email })

    await page.goto('/users')
    const linha = page.getByRole('row').filter({ hasText: email })
    await expect(linha).toContainText(nome)
    page.once('dialog', dialog => dialog.accept())
    await linha.getByRole('button', { name: 'Excluir' }).click()

    await expect(linha).toBeHidden()
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: email })).toBeHidden()
  })

  test('J04 #2 cancela exclusão e mantém usuário após recarregar', async ({ page, dados }) => {
    const nome = unico('Usuário J04 manter')
    const email = emailUnico('j04-cancelar')
    await dados.criarUsuario({ name: nome, email })

    await page.goto('/users')
    const linha = page.getByRole('row').filter({ hasText: email })
    await expect(linha).toContainText(nome)
    page.once('dialog', dialog => dialog.dismiss())
    await linha.getByRole('button', { name: 'Excluir' }).click()

    await expect(linha).toContainText(nome)
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: email })).toContainText(nome)
  })
})
test.describe('J07 — Email já cadastrado', () => {
  test('J07 #1 rejeita email já cadastrado e mantém usuário original após recarregar', async ({
    page,
    dados
  }) => {
    // DEFEITO: a API 409 é apresentada como mensagem genérica, não como RF09.
    test.fail(true, 'DEFEITO: mensagem de conflito não corresponde à mensagem especificada em RF09')
    const nomeOriginal = unico('Usuário J07 original')
    const nomeDuplicado = unico('Usuário J07 duplicado')
    const email = emailUnico('j07')
    await dados.criarUsuario({ name: nomeOriginal, email })

    await page.goto('/users')
    await page.getByRole('button', { name: 'Adicionar Usuário' }).click()
    await page.getByLabel('Nome:').fill(nomeDuplicado)
    await page.getByLabel('Email:').fill(email)
    await page.getByRole('button', { name: 'Criar' }).click()

    await expect(page.getByText('Email já cadastrado')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Criar' })).toBeVisible()
    await expect(page.getByLabel('Nome:')).toHaveValue(nomeDuplicado)
    await expect(page.getByLabel('Email:')).toHaveValue(email)

    await page.reload()
    const linhaOriginal = page.getByRole('row').filter({ hasText: email })
    await expect(linhaOriginal).toContainText(nomeOriginal)
    await expect.soft(page.getByText(nomeDuplicado)).toBeHidden()
  })
})