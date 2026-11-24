import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma, resetDb, seedUserAndCategory } from './helpers/db'

describe('DELETE /api/categories/:id (API03)', () => {
  beforeEach(async () => { await resetDb() })
  afterAll(async () => { await prisma.$disconnect() })

  it.fails('exclui categoria sem tarefas conforme envelope de sucesso', async () => {
    const { category } = await seedUserAndCategory()
    const res = await request(app).delete(`/api/categories/${category.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ success: true, data: expect.anything() })
    expect(await prisma.category.findUnique({ where: { id: category.id } })).toBeNull()
  })

  it('impede excluir categoria com tarefas e mantém os registros', async () => {
    const { user, category } = await seedUserAndCategory()
    const task = await prisma.task.create({ data: { title: 'Relatorio', userId: user.id, categoryId: category.id } })
    const res = await request(app).delete(`/api/categories/${category.id}`)
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, error: expect.any(String) })
    expect(await prisma.category.findUnique({ where: { id: category.id } })).not.toBeNull()
    expect(await prisma.task.findUnique({ where: { id: task.id } })).not.toBeNull()
  })

  it('responde 404 para categoria inexistente', async () => {
    const res = await request(app).delete('/api/categories/inexistente')
    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ success: false, error: expect.any(String) })
    expect(await prisma.category.count()).toBe(0)
  })
})

describe('POST /api/categories (API04)', () => {
  beforeEach(async () => { await resetDb() })

  it('cria categoria com nome inedito', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Lazer' })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toMatchObject({ name: 'Lazer' })
    expect(await prisma.category.findUnique({ where: { name: 'Lazer' } })).not.toBeNull()
  })

  it.fails('rejeita duplicidade apos normalizacao sem criar registro', async () => {
    await seedUserAndCategory()
    const res = await request(app).post('/api/categories').send({ name: 'Trabalho' })
    expect(res.status).toBe(409)
    expect(res.body).toMatchObject({ success: false, error: expect.any(String) })
    expect(await prisma.category.count()).toBe(1)
  })
})
