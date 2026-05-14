# Kanban Board Web UI 🎨

Uma interface de usuário fluida e responsiva para gerenciamento de tarefas em estilo Kanban. Este projeto foi desenvolvido inteiramente com **Vanilla JavaScript, HTML5 e CSS3**, sem o uso de frameworks pesados, focando em performance, manipulação direta do DOM e usabilidade.

---

## ✨ Funcionalidades

- **Autenticação:** Integração fluida de login e cadastro na mesma tela
- **Drag & Drop otimizado:** Movimentação suave de cards entre colunas com cálculo dinâmico de posições
- **Suporte mobile:** Uso de polyfill para garantir funcionamento do drag and drop em dispositivos touch (smartphones e tablets), incluindo rolagem horizontal automática (*auto-scroll*)
- **Edição inline:** Títulos de colunas e conteúdos dos cards podem ser editados diretamente, com salvamento automático no evento `blur`
- **Theming inteligente:** Suporte a modo claro e escuro via CSS Variables. Detecta automaticamente a preferência do sistema (`matchMedia`) e permite alternância manual com persistência no `localStorage`

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

Certifique-se de que a API (backend) esteja rodando localmente na porta 3000.

### 3. Inicie a aplicação

Como é um projeto Vanilla, não há necessidade de build.

Basta abrir o arquivo:

```
login.html
```

Recomendação: utilize a extensão **Live Server** do VS Code para evitar problemas com CORS ao usar o protocolo `file://`.

---

## 🧠 Arquitetura de Comunicação (Optimistic UI)

O frontend aplica o conceito de **interface otimista**.

Quando o usuário realiza uma ação (como mover um card), a alteração visual acontece imediatamente na tela, enquanto a requisição `PATCH` é enviada em segundo plano para o servidor.

Isso garante uma experiência fluida, sem bloqueios de interface ou necessidade de loaders.
