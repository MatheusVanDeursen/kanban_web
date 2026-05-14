# Kanban Board Web UI 🎨

Uma interface de usuário fluida e responsiva para gerenciamento de tarefas em estilo Kanban. Este projeto foi desenvolvido inteiramente com **Vanilla JavaScript, HTML5 e CSS3**, sem o uso de frameworks pesados, focando em performance, manipulação direta do DOM e usabilidade.

## ✨ Funcionalidades
* **Autenticação:** Integração fluida de Login e Cadastro na mesma tela.
* **Drag & Drop Otimizado:** Movimentação suave de cards entre colunas com cálculo dinâmico de posições.
* **Suporte Mobile:** Utilização de Polyfill para garantir que o Drag & Drop funcione perfeitamente em telas sensíveis ao toque (smartphones e tablets), incluindo rolagem horizontal automática (*auto-scroll*).
* **Edição Inline:** Títulos de colunas e conteúdos dos cards podem ser editados diretamente no texto, salvando automaticamente no evento `blur`.
* **Theming Inteligente:** Suporte a Modo Claro e Escuro utilizando CSS Variables. O sistema detecta a preferência do sistema operacional do usuário automaticamente (via `matchMedia`), mas permite a troca manual com persistência no `localStorage`.

## 🚀 Como rodar o projeto

Este projeto é totalmente estático e consome a [Kanban Board API](https://github.com/SeuUsuario/kanban-api).

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/SeuUsuario/kanban-web.git](https://github.com/SeuUsuario/kanban-web.git)
   cd kanban-web
Requisito Prévio:
Certifique-se de que a API (Backend) esteja rodando localmente na porta 3000.

Inicie a aplicação:
Como é um projeto Vanilla, você não precisa compilar nada. Basta abrir o arquivo login.html no seu navegador.
Recomendação: Utilize a extensão Live Server do VS Code para uma melhor experiência e evitar bloqueios de CORS por protocolo file://.

🧠 Arquitetura de Comunicação (Optimistic UI)
O Front-end aplica os conceitos de Interface Otimista. Quando o usuário realiza uma ação (como mover um card), a alteração visual acontece imediatamente na tela, enquanto a requisição PATCH é disparada em segundo plano para o servidor, garantindo uma experiência de uso sem interrupções ou travamentos (loaders).
