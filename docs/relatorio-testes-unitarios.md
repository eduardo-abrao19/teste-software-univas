# Relatório — Testes de integração

**Ferramenta de IA utilizada:** Codex  
**Escopo:** Backend API03–API05 e frontend Users RF08–RF09.

## 1. Tabela de casos

A tabela definida no prompt estava vazia. Os casos abaixo foram propostos pela IA exclusivamente com base em `docs/especificacao.md`; não foram acrescentadas regras fora da especificação. O campo “Efeito no banco” aplica-se aos casos backend; os casos frontend usam API simulada por MSW.

| # | Estado inicial | Requisição / ação | Resposta esperada | Efeito no banco | Regra |
|---|---|---|---|---|---|
| 1 | Categoria existente sem tarefas | `DELETE /api/categories/:id` | 200; sucesso no formato do contrato | Categoria removida | API03 |
| 2 | Categoria existente com uma tarefa | `DELETE /api/categories/:id` | 400; erro `{ success: false, error }` | Categoria e tarefa permanecem | API03 / RN02 |
| 3 | Categoria inexistente | `DELETE /api/categories/:id` | 404; erro `{ success: false, error }` | Nenhuma categoria é criada/removida | API03 |
| 4 | Categoria inexistente com nome novo | `POST /api/categories` com `Lazer` | 201; sucesso `{ success: true, data }` | Categoria criada | API04 / RN03 |
| 5 | Categoria chamada ` trabalho ` já existe | `POST /api/categories` com `Trabalho` | 409; erro `{ success: false, error }` | Nenhuma categoria adicional | API04 / RN03 |
| 6 | Tarefa `PENDING` existente | `PUT /api/tasks/:id` com `IN_PROGRESS` | 200; sucesso e tarefa em `IN_PROGRESS` | Status atualizado | API05 / RN01 / RN04 |
| 7 | Tarefa `COMPLETED` existente | `PUT /api/tasks/:id` com `PENDING` | 400; erro `{ success: false, error }` | Tarefa permanece `COMPLETED` | API05 / RN01 / RN04 |
| 8 | Tarefa inexistente | `PUT /api/tasks/:id` com `IN_PROGRESS` | 404; erro `{ success: false, error }` | Nenhuma tarefa criada/alterada | API05 |
| 9 | Lista inicia vazia; POST aceito; listagem seguinte inclui novo usuário | Preencher Nome/Email e clicar Criar | POST com os dados; sucesso 201; formulário fecha e lista recarregada exibe usuário | Não aplicável (MSW) | RF08 / API01 |
| 10 | Lista vazia; POST responde 409 | Preencher Nome/Email e clicar Criar | Mensagem `Email já cadastrado`; formulário e valores permanecem | Não aplicável (MSW) | RF09 / API01 |

## 2. Prompt utilizado

> Contexto: projeto teste-software-univas (Windows/PowerShell, C:\Dev\teste-software-univas). Atividade prática de testes de integração. Leia primeiro docs/especificacao.md (contratos API01 a API05, regras RN01 a RN04, requisitos RF08 e RF09 do componente Users) e o AGENTS.md (seção Testes de integração). Veja também os testes de referência: backend/tests/integration/users.int.test.ts e frontend/tests/integration/Users.load.int.test.tsx, além de helpers/db.ts e tests/msw/server.ts.
>
> Tarefa: escreva os testes de integração e preencha o relatório.
> - Backend: rotas API03, API04 e API05, em backend/tests/integration/ (ex.: categories.int.test.ts e demais arquivos necessários), com Supertest + PostgreSQL de teste.
> - Frontend: RF08 e RF09 do componente Users, em frontend/tests/integration/, com Testing Library + MSW.
> - Relatório: docs/relatorio-testes-unitarios.md, com a coluna "Efeito no banco".
>
> Casos obrigatórios definidos pelo aluno: tabela vazia. Se vazia, propor casos a partir da especificação e identificar a autoria da proposta.
>
> Restrições: seguir AGENTS.md; usar request(app), helpers reais do DB; sem vi.mock/vi.spyOn(api); não alterar testDatabase.ts nem URL; cada teste isolado; backend validar corpo e banco; MSW seguir contrato e validar corpo POST/PUT; não alterar src/; falha contratual deve permanecer como it.fails e ser relatada; sem commit/push.
>
> Execução: iniciar postgres, executar integração backend e frontend, corrigindo apenas testes; realizar as quatro sabotagens indicadas uma de cada vez, restaurar src e registrar resultados.

## 3. Revisão dos sinais de alerta

| Verificação | Resultado |
|---|---|
| `vi.mock` no backend / `vi.spyOn(api)` no frontend | Não usados. |
| Teste verifica só status HTTP | Não; testes backend também verificam envelope/campos e efeito persistido consultado via Prisma. |
| Dependência entre testes | Não; cada `it` chama `resetDb()` e cria seus próprios dados. |
| Alteração do banco ou URL de teste | Helpers originais usados; nenhuma alteração em `testDatabase.ts` ou URL. A execução falhou antes dos testes por autenticação do PostgreSQL. |
| Formato dos handlers MSW | Respostas no contrato `{ success, count, data }`, `{ success, data }` e `{ success: false, error }`. |
| POST sem validação do corpo | Handler POST de RF08 e RF09 executa `await request.json()` e compara os campos enviados. |
| Ajuste após execução | Rótulo do botão no teste foi escrito com escape Unicode para corresponder ao texto acessível; RF08 então passou. RF09 é `it.fails` devido à mensagem específica não implementada conforme contrato. |

## 4. Execução e sabotagens

- Backend: `docker compose up -d postgres` iniciou o container. `npm run test:integration` não chegou aos testes: `prisma db push` retornou `P1000 Authentication failed` para o usuário `postgres` em `localhost:5432`. O volume existente não foi apagado nem reconfigurado. Portanto, os casos backend não têm resultado validado nesta execução.
- Frontend: `npm run test:integration` passou: 2 testes aprovados e 1 falha esperada (`it.fails`) em 2 arquivos. RF08 passou; RF09 permaneceu como falha esperada, documentando divergência.
- Sabotagens 1–3 (API03, API01, API02): não executadas, pois exigiam rodar a suíte backend após cada mudança, bloqueada pelo erro P1000. Não foi alterado `src/`.
- Sabotagem 4 (remover `fetchUsers()` em Users.tsx): executada com alteração temporária e restauração via `git restore src/`. O teste RF08 falhou na asserção da exibição de Bruno Lima após o POST; detector confirmado. A primeira tentativa foi descartada por efeito de codificação do PowerShell e a repetição preservou UTF-8. O frontend passou novamente após restaurar `src/`.

## 5. Testes e relação com a tabela

| Arquivo | Teste | Linha(s) da tabela | Resultado observado |
|---|---|---:|---|
| `backend/tests/integration/categories.int.test.ts` | Exclui categoria sem tarefas | 1 | Não executado: falha de autenticação do PostgreSQL antes da coleta |
| `backend/tests/integration/categories.int.test.ts` | Impede excluir categoria com tarefas e mantém registros | 2 | Não executado: falha de autenticação do PostgreSQL antes da coleta |
| `backend/tests/integration/categories.int.test.ts` | 404 para categoria inexistente | 3 | Não executado: falha de autenticação do PostgreSQL antes da coleta |
| `backend/tests/integration/categories.int.test.ts` | Cria categoria inédita | 4 | Não executado: falha de autenticação do PostgreSQL antes da coleta |
| `backend/tests/integration/categories.int.test.ts` | Rejeita duplicidade normalizada | 5 | Não executado: falha de autenticação do PostgreSQL antes da coleta |
| `backend/tests/integration/tasks.int.test.ts` | Grava transição PENDING → IN_PROGRESS | 6 | Não executado: falha de autenticação do PostgreSQL antes da coleta |
| `backend/tests/integration/tasks.int.test.ts` | Rejeita transição proibida e preserva status | 7 | Não executado: falha de autenticação do PostgreSQL antes da coleta |
| `backend/tests/integration/tasks.int.test.ts` | 404 para tarefa inexistente | 8 | Não executado: falha de autenticação do PostgreSQL antes da coleta |
| `frontend/tests/integration/Users.create.int.test.tsx` | Envia dados, fecha formulário e exibe usuário recarregado | 9 | Passou |
| `frontend/tests/integration/Users.create.int.test.tsx` | Exibe mensagem de conflito e preserva formulário/valores | 10 | Falha esperada (`it.fails`); divergência abaixo |

## 6. Defeitos e limitações encontrados

| Regra | Esperado | Obtido / evidência | Teste |
|---|---|---|---|
| RF09 / API01 | HTTP 409 deve exibir `Email já cadastrado` e preservar formulário e campos. | A especificação define a mensagem; a implementação atual do componente apresenta `Erro ao salvar usuário` para qualquer falha. O teste específico permanece `it.fails`. | RF09 em `Users.create.int.test.tsx` |
| Infraestrutura backend | Conexão ao banco de teste `teste_software_test_db`. | Prisma retorna P1000 (credenciais rejeitadas), antes de iniciar os testes; não foi possível determinar resultados dos testes backend nesta sessão. | Suíte backend inteira |

Nenhum commit ou push foi feito.

### Divergencias adicionais observadas na revisão do contrato

| Regra | Esperado | Obtido / evidência | Teste |
|---|---|---|---|
| API03 | Envelope de sucesso com `{ success: true, data: ... }`. | A resposta de exclusão contém `success` e `message`, sem `data`; a asserção contratual continua ativa e o caso está marcado `it.fails`. Execução backend bloqueada por P1000, então a falha não pôde ser confirmada em runtime. | API03 — exclusão sem tarefas |
| API04 / RN03 | `Trabalho` deve conflitar com categoria existente `trabalho` após normalização. | O caminho de criação observado tenta gravar o nome recebido sem normalizar; o caso mantém 409 e ausência de criação, marcado `it.fails`. Execução backend bloqueada por P1000, então a falha não pôde ser confirmada em runtime. | API04 — duplicidade normalizada |
