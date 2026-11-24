import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma, resetDb, seedUserAndCategory } from './helpers/db'

describe('PUT /api/tasks/:id (API05)', () => {
  beforeEach(async () => { await resetDb() })
  afterAll(async () => { await prisma.$disconnect() })

  async function criarTarefa(status: 'PENDING' | 'COMPLETED' = 'PENDING') {
    const { user, category } = await seedUserAndCategory()
    return prisma.task.create({ data: { title: 'Relatorio', status, userId: user.id, categoryId: category.id } })
  }

  it('grava transicao permitida de PENDING para IN_PROGRESS', async () => {
    const task = await criarTarefa()
    const res = await request(app).put(`/api/tasks/${task.id}`).send({ status: 'IN_PROGRESS' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toMatchObject({ id: task.id, status: 'IN_PROGRESS' })
    expect((await prisma.task.findUnique({ where: { id: task.id } }))?.status).toBe('IN_PROGRESS')
  })

  it('rejeita transicao proibida e preserva o status', async () => {
    const task = await criarTarefa('COMPLETED')
    const res = await request(app).put(`/api/tasks/${task.id}`).send({ status: 'PENDING' })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, error: expect.any(String) })
    expect((await prisma.task.findUnique({ where: { id: task.id } }))?.status).toBe('COMPLETED')
  })

  it('responde 404 para tarefa inexistente', async () => {
    const res = await request(app).put('/api/tasks/inexistente').send({ status: 'IN_PROGRESS' })
    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ success: false, error: expect.any(String) })
    expect(await prisma.task.count()).toBe(0)
  })
})
