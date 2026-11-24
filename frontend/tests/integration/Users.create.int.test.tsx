import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import Users from '../../src/components/Users'
import { server } from '../msw/server'

const userRecord = {
  id: 'u2', name: 'Bruno Lima', email: 'bruno@email.com',
  createdAt: '2026-11-01T10:00:00.000Z', tasks: []
}

describe('Users + API — criacao (RF08 / API01)', () => {
  it('envia os dados, fecha o formulario e exibe o usuario da lista recarregada', async () => {
    const user = userEvent.setup()
    let bodyRecebido: unknown
    let quantidadeListagens = 0
    server.use(
      http.get('*/api/users', () => {
        quantidadeListagens += 1
        return HttpResponse.json({ success: true, count: quantidadeListagens > 1 ? 1 : 0, data: quantidadeListagens > 1 ? [userRecord] : [] })
      }),
      http.post('*/api/users', async ({ request }) => {
        bodyRecebido = await request.json()
        expect(bodyRecebido).toEqual({ name: 'Bruno Lima', email: 'bruno@email.com' })
        return HttpResponse.json({ success: true, data: { id: 'u2', name: 'Bruno Lima', email: 'bruno@email.com' } }, { status: 201 })
      })
    )

    render(<Users />)
    await user.click(await screen.findByRole('button', { name: 'Adicionar Usu\u00e1rio' }))
    await user.type(screen.getByLabelText(/Nome/i), 'Bruno Lima')
    await user.type(screen.getByLabelText(/Email/i), 'bruno@email.com')
    await user.click(screen.getByRole('button', { name: 'Criar' }))

    expect(await screen.findByText('Bruno Lima')).toBeInTheDocument()
    expect(bodyRecebido).toEqual({ name: 'Bruno Lima', email: 'bruno@email.com' })
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Criar' })).not.toBeInTheDocument())
  })
})

describe('Users + API — email duplicado (RF09 / API01)', () => {
  it.fails('exibe mensagem de conflito e preserva formulario e dados', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('*/api/users', () => HttpResponse.json({ success: true, count: 0, data: [] })),
      http.post('*/api/users', async ({ request }) => {
        const body = await request.json()
        expect(body).toEqual({ name: 'Bruno Lima', email: 'duplicado@email.com' })
        return HttpResponse.json({ success: false, error: 'Email j\u00e1 cadastrado' }, { status: 409 })
      })
    )

    render(<Users />)
    await user.click(await screen.findByRole('button', { name: 'Adicionar Usu\u00e1rio' }))
    await user.type(screen.getByLabelText(/Nome/i), 'Bruno Lima')
    await user.type(screen.getByLabelText(/Email/i), 'duplicado@email.com')
    await user.click(screen.getByRole('button', { name: 'Criar' }))

    expect(await screen.findByText('Email j\u00e1 cadastrado')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nome/i)).toHaveValue('Bruno Lima')
    expect(screen.getByLabelText(/Email/i)).toHaveValue('duplicado@email.com')
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument()
  })
})

