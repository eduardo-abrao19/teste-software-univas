import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Users from '../../src/components/Users'
import { api } from '../../src/services/api'

describe('Users — carregamento (RF01)', () => {
  it('exibe o indicador enquanto a lista de usuários está sendo carregada', async () => {
    let concluirRequisicao!: (resposta: { data: { data: never[] } }) => void
    vi.spyOn(api, 'get').mockImplementation(() => new Promise((resolve) => {
      concluirRequisicao = resolve
    }))

    render(<Users />)

    expect(screen.getByText('Carregando usuários...')).toBeInTheDocument()

    concluirRequisicao({ data: { data: [] } })
    expect(await screen.findByRole('heading', { name: 'Usuários' })).toBeInTheDocument()
  })
})
