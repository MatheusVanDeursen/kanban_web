# Kanban Board Web UI 🎨

Uma interface de usuário fluida e responsiva para gerenciamento de tarefas em estilo Kanban. Este projeto foi desenvolvido inteiramente com **Vanilla JavaScript, HTML5 e CSS3**, focando em performance, manipulação direta do DOM e usabilidade avançada sem a dependência de frameworks pesados.

---

## ✨ Funcionalidades

- **Autenticação completa:** Fluxo unificado de login, cadastro e recuperação de senha com validação de tokens
- **Google OAuth 2.0:** Login social integrado utilizando o Google Identity Services SDK
- **Interface otimista (Optimistic UI):**
  - Atualização imediata da UI após ações do usuário
  - Sistema de *toast notifications* ("Salvando...", "Salvo")
  - **Rollback automático:** se a API falhar, o card retorna à posição original
- **Drag & Drop inteligente:** Movimentação suave com auto-redimensionamento baseado no conteúdo
- **Theming dinâmico:**
  - Suporte a modo claro e escuro com CSS variables
  - Detecção automática via `matchMedia`
  - Persistência da escolha no `localStorage`
  - Integração visual com botão de login Google
- **Tratamento de estado vazio/erro:**
  - Telas amigáveis para falhas de conexão
  - Botões de retry sem recarregar a página (comportamento SPA)

---

## 🚀 Como rodar o projeto

Este projeto é totalmente estático e consome a API do backend:
https://github.com/SeuUsuario/kanban-api

### 1. Clone o repositório

```bash
git clone https://github.com/MatheusVanDeursen/kanban_web
cd kanban-web
```

### 2. Requisito prévio

Certifique-se de que a API (backend) esteja rodando localmente.

### 3. Inicie a aplicação

Para garantir o funcionamento correto (especialmente para autenticação Google e evitar problemas de CORS com `file://`), utilize um servidor local.

Abra o projeto com uma ferramenta como:

- Live Server (extensão do VS Code)

E carregue o arquivo:

```
login.html
```

---
