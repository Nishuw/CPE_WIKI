<h1 align="center">Documentação do Projeto - Plataforma de Gerenciamento de Conteúdo</h1>

Este documento fornece uma visão detalhada sobre o projeto, suas funcionalidades, estrutura, e instruções para configuração e desenvolvimento. Ele é projetado para ser uma referência abrangente e acessível para novos desenvolvedores que irão trabalhar no projeto.

## 1. Propósito do Projeto

Nesta seção, detalhamos o objetivo principal do projeto, o valor que ele oferece aos usuários e o problema que ele se propõe a resolver.

### 1.1 Objetivo Principal

O projeto é uma plataforma web interativa para gerenciar e consumir conteúdo organizado por tópicos. Seu objetivo principal é facilitar o acesso a conteúdo relevante e bem estruturado, enquanto oferece aos administradores ferramentas eficientes para gerenciar esse conteúdo e aos usuários uma experiência personalizável.

### 1.2 Valor para o Usuário

Para o usuário final, a plataforma oferece:

*   **Acesso Fácil:** Conteúdo organizado e acessível.
*   **Navegação Intuitiva:** Interface simples para encontrar e consumir conteúdo.
*   **Conteúdo Atualizado:** Conteúdo gerenciado e atualizado regularmente pelos administradores.
*   **Personalização:** Opção de tema (Modo Escuro) e gerenciamento de perfil individual.
*   **Design Responsivo:** Experiência de uso adaptada para diferentes tamanhos de tela (desktop, tablets, mobile).

### 1.3 Problema Resolvido

O projeto resolve o problema da desorganização de conteúdo e da dificuldade de acesso a informações específicas. Ele centraliza o conteúdo em uma plataforma única, facilitando a gestão e o consumo, e oferece uma experiência de usuário moderna e adaptável.
   
## 2. Tecnologias Utilizadas

Esta seção lista e descreve as tecnologias que foram utilizadas no desenvolvimento do projeto, tanto no frontend quanto no backend. Cada tecnologia é justificada pela sua escolha, destacando seus benefícios.

#### 2.1 Frontend (Client-Side)

*   **React (v18.x):** Biblioteca JavaScript para construir interfaces de usuário dinâmicas e reativas. Escolha baseada na sua vasta comunidade, reusabilidade de componentes e performance.
*   **TypeScript:** Superconjunto do JavaScript que adiciona tipagem estática, melhorando a manutenção e a qualidade do código.
*   **Vite:** Ferramenta de build que oferece um ambiente de desenvolvimento rápido e otimizações para produção. Foi escolhido pela sua velocidade e eficiência.
*   **Tailwind CSS:** Framework CSS utility-first que permite o desenvolvimento rápido de interfaces de usuário responsivas e consistentes.
*   **Firebase (v11.x):** Plataforma para banco de dados (Firestore), autenticação e hospedagem. Escolha baseada na facilidade de uso, escalabilidade e integração com o backend.
*   **React Router DOM (v6.x):** Para gerenciamento de rotas na aplicação single-page.
*   **Lucide React:** Biblioteca de ícones SVG leves e customizáveis.
*   **React Hot Toast:** Para notificações e alertas não intrusivos.

#### 2.2 Backend (Firebase Cloud Functions)

*   **Node.js:** Ambiente de execução JavaScript para execução de funções serverless, permitindo que o backend seja escrito na mesma linguagem do frontend.
*   **Firebase Cloud Functions:** Funções serverless que executam lógica de backend em resposta a eventos do Firebase, escalando automaticamente.

### Dependências Principais (package.json)

As dependências e suas versões exatas podem ser encontradas no arquivo `package.json`.
Principais dependências incluem:
<CODE_BLOCK>
{
  "dependencies": {
    "firebase": "^11.6.1", // Exemplo, verificar package.json para versão exata
    "lucide-react": "^0.344.0", // Exemplo
    "react": "^18.3.1", // Exemplo
    "react-dom": "^18.3.1", // Exemplo
    "react-hot-toast": "^2.5.2", // Exemplo
    "react-router-dom": "^6.22.3" // Exemplo
  }
}
</CODE_BLOCK>

*Nota: As dependências `@emotion/react`, `@emotion/styled`, `@mui/icons-material`, `@mui/material` foram removidas ou substituídas por alternativas como Lucide React e Tailwind CSS.*

#### 2.3 Ferramentas de Desenvolvimento

*   **ESLint:** Garante a qualidade e consistência do código JavaScript e TypeScript.
*   **Prettier:** Formata o código automaticamente para manter um padrão consistente e legível.

## 3. Estrutura do Projeto
  
### 3.1 Diretórios Principais

A organização do projeto em diretórios facilita a localização de arquivos e a compreensão da estrutura do projeto.

*   **`src/`:** Contém todo o código-fonte do frontend.
    *   **`App.tsx`:** Componente principal da aplicação.
    *   **`firebase.ts`:** Arquivo de configuração do Firebase (idealmente usando variáveis de ambiente).
    *   **`index.css`:** Estilos globais da aplicação (Tailwind CSS é configurado aqui).
    *   **`main.tsx`:** Ponto de entrada principal para o frontend.
    *   **`vite-env.d.ts`:** Definições de tipo para o ambiente Vite.
    *   **`context/`:** Contém os contextos de aplicação.
        *   **`AuthContext.tsx`:** Contexto para gestão de autenticação.
        *   **`ContentContext.tsx`:** Contexto para gestão de conteúdos.
        *   **`ThemeContext.tsx`:** Contexto para gestão do tema (claro/escuro).
    *   **`pages/`:** Contém as páginas da aplicação.
        *   **`ContentViewPage.tsx`:** Página para visualizar conteúdos.
        *   **`HomePage.tsx`:** Página inicial.
        *   **`LoginPage.tsx`:** Página de login (sempre em tema claro).
        *   **`TopicPage.tsx`:** Página para visualizar um tópico específico.
        *   **`UserProfilePage.tsx`:** Página para o usuário gerenciar seu perfil (nome, email, senha).
        *   **`admin/`:** Contém as páginas de administração.
            *   **`AdminDashboard.tsx`:** Painel de controle administrativo.
            *   **`ContentEditPage.tsx`:** Página para editar conteúdos.
            *   **`NewTopicPage.tsx`:** Página para criar novos tópicos.
            *   **`TopicDetailPage.tsx`:** Página para visualizar detalhes de um tópico.
            *   **`TopicManagementPage.tsx`:** Página para gerenciar tópicos.
            *   **`UserManagementPage.tsx`:** Página para gerenciar usuários.
    *   **`components/`:** Componentes reutilizáveis.
        *   **`admin/`:** Componentes administrativos.
            *   **`ContentEditor.tsx`:** Editor de conteúdo.
            *   **`ContentList.tsx`:** Lista de conteúdos.
            *   **`TopicForm.tsx`:** Formulário para criar/editar tópicos.
            *   **`TopicList.tsx`:** Lista de tópicos.
        *   **`auth/`:** Componentes de autenticação.
            *   **`AuthForm.tsx`:** Formulário de autenticação (login/cadastro, sempre em tema claro).
            *   **`UserProfileForm.tsx`:** Formulário para edição de perfil do usuário.
        *   **`layout/`:** Componentes de layout.
            *   **`Header.tsx`:** Cabeçalho da aplicação (com toggle para sidebar e tema).
            *   **`Layout.tsx`:** Componente de layout principal (gerencia a sidebar responsiva).
            *   **`Sidebar.tsx`:** Barra lateral de navegação (responsiva, funciona como "drawer" em telas menores).
        *   **`ui/`:** Componentes de interface do usuário genéricos.
            *   **`Button.tsx`:** Botão customizado.
            *   **`ConfirmDialog.tsx`:** Dialog de confirmação.
            *   **`Input.tsx`:** Input customizado.
    *    **`types/`**: Definições de tipos TypeScript utilizadas na aplicação.
        *    **`index.ts`**: Agrupa e exporta definições de tipos.
*   **`functions/`:** Contém o código-fonte do backend (Firebase Cloud Functions).
    *   **`index.js`:** Ponto de entrada principal para as Cloud Functions.
    *   **`package.json`:** Dependências do backend.
*   **`scripts/`:** Contém scripts utilitários para tarefas de manutenção ou administração (ex: `setAdminClaim.js`, `migrateUsernames.cjs`).
*   **`public/`:** Arquivos estáticos são gerenciados pelo Vite e geralmente colocados na pasta `public/` na raiz do projeto ou importados diretamente no código-fonte.

## 4. Configuração Local

### 4.1 Pré-requisitos

Antes de começar, certifique-se de ter o seguinte instalado:

*   **Node.js (v18 ou superior):** Para executar o projeto frontend e backend.
*   **npm (geralmente instalado com Node.js) ou yarn:** Gerenciador de pacotes.
*   **Firebase CLI:** Para interagir com o Firebase (deploy de functions, etc.).

### 4.2 Configurando o Frontend

1.  Navegue até a raiz do projeto.
2.  Instale as dependências:
    <CODE_BLOCK>
        npm install
    </CODE_BLOCK>
3. Crie um arquivo `.env` na raiz do projeto e preencha com as credenciais do seu projeto Firebase. Exemplo:
<CODE_BLOCK>
VITE_API_KEY="SUA_API_KEY"
VITE_AUTH_DOMAIN="SEU_AUTH_DOMAIN"
VITE_PROJECT_ID="SEU_PROJECT_ID"
VITE_STORAGE_BUCKET="SEU_STORAGE_BUCKET"
VITE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID"
VITE_APP_ID="SEU_APP_ID"
</CODE_BLOCK>
*Nota: É crucial que o arquivo `src/firebase.ts` seja configurado para ler estas variáveis de ambiente (ex: `import.meta.env.VITE_API_KEY`).*

### 4.3 Configurando o Backend (Firebase Functions)

1.  Navegue até o diretório `functions/`.
2.  Instale as dependências:
    <CODE_BLOCK>
        npm install
    </CODE_BLOCK>
3.  Certifique-se de que o Firebase CLI está configurado (`firebase login`) e associado ao seu projeto (`firebase use SEU_PROJECT_ID`).

### 4.4 Executando o Projeto

#### 4.4.1 Executando o Frontend

1.  Navegue até a raiz do projeto.
2.  Inicie o servidor de desenvolvimento Vite:
    <CODE_BLOCK>
        npm run dev
    </CODE_BLOCK>

#### 4.4.2 Executando o Backend Localmente (Emulador Firebase)

1.  Navegue até o diretório `functions/` (ou da raiz do projeto, se configurado).
2.  Inicie o emulador do Firebase (para Functions, Firestore, Auth, etc.):
    <CODE_BLOCK>
        firebase emulators:start
    </CODE_BLOCK>
    (Consulte a documentação do Firebase para configurar o emulador de acordo com suas necessidades).

## 5. Funcionalidades Principais

### 5.1 Autenticação de Usuários

*   **Login e Cadastro:** Usuários podem se cadastrar e autenticar usando email e senha através do `AuthForm.tsx` (que sempre utiliza tema claro).
*   **Gerenciamento de Perfil:** Usuários autenticados podem acessar `UserProfilePage.tsx` para atualizar seu nome de usuário, email e senha.
*   **Gerenciamento de Sessão:** O contexto `AuthContext.tsx` controla o estado de autenticação, login, logout e informações do usuário.
*   **Integração com Firebase Authentication.**

### 5.2 Gestão de Conteúdo (Administradores)

#### 5.2.1 Tópicos

*   Administradores podem criar, editar, mover e excluir tópicos hierárquicos através da `TopicManagementPage.tsx` e `TopicDetailPage.tsx`.

#### 5.2.2 Conteúdo

*   Administradores podem criar, editar e excluir artigos/conteúdos dentro de tópicos específicos usando um editor na `ContentEditPage.tsx`.
*   Usuários visualizam o conteúdo na `ContentViewPage.tsx` e através da navegação na `Sidebar`.

### 5.3 Sistema de Roles

*   **Usuário Comum:** Pode se registrar, fazer login, gerenciar seu perfil, navegar e visualizar tópicos e conteúdos publicados, e alternar o tema da interface.
*   **Administrador:** Possui todas as permissões de um usuário comum, mais a capacidade de gerenciar tópicos, conteúdos e outros usuários (atribuir/remover role de admin).

### 5.4 Gestão de Usuários (Administradores)

*   Administradores podem visualizar a lista de usuários e atribuir ou remover a role de administrador através da `UserManagementPage.tsx`.
*   A atribuição de claims de admin é realizada por meio de scripts server-side (ex: `setAdminClaim.js` na pasta `scripts/`).

### 5.5 Interface do Usuário

*   **Modo Escuro (Dark Mode):** A plataforma suporta um tema escuro, que pode ser ativado/desativado pelo usuário. Gerenciado por `ThemeContext.tsx`.
*   **Design Responsivo:** A interface é construída com Tailwind CSS para se adaptar a diferentes tamanhos de tela, com uma sidebar que se transforma em "drawer" em dispositivos móveis.
*   **Navegação Intuitiva:** A `Sidebar` permite fácil navegação pela estrutura de tópicos e conteúdos.
*   **Notificações:** Feedbacks visuais para ações do usuário são fornecidos através de toasts (React Hot Toast).

## 6. Organização do Conteúdo

*   O conteúdo é organizado hierarquicamente por tópicos.
*   Cada tópico pode conter múltiplos artigos (conteúdos) e subtópicos.
*   O modelo de dados no Firestore utiliza coleções de `topics` e `contents`, com referências para estruturar a hierarquia.

## 7. Scripts Utilitários (`scripts/`)

A pasta `scripts/` contém scripts Node.js para diversas tarefas administrativas ou de migração, como:
*   `setAdminClaim.js`: Atribui a custom claim de administrador a um usuário no Firebase Auth.
*   `removeAdmin.cjs`: Remove a custom claim de administrador.
*   `migrateUsernames.cjs`: Exemplo de script para migração de dados.
*   `addUpdatedByToTopics.cjs`: Exemplo de script para atualização em lote de documentos.
É importante revisar e entender cada script antes de executá-lo.

## 8. Contribuição

*   Para contribuir, faça um fork do projeto, crie uma branch para sua feature (`git checkout -b feature/NovaFeature`), faça as alterações e submeta um Pull Request para a branch principal do repositório original.
*   Certifique-se de que seu código segue os padrões de linting (`npm run lint`).

## 9. Notas Adicionais

*   **Firebase SDK:** O frontend interage diretamente com os serviços do Firebase (Auth, Firestore, Storage) usando o SDK do Firebase para web.
*   **Cloud Functions:** Para operações que exigem privilégios elevados ou lógica server-side, são utilizadas Firebase Cloud Functions.

