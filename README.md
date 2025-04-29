<h1 align="center">Documentação do Projeto - Plataforma de Gerenciamento de Conteúdo</h1>

Este documento fornece uma visão detalhada sobre o projeto, suas funcionalidades, estrutura, e instruções para configuração e desenvolvimento. Ele é projetado para ser uma referência abrangente e acessível para novos desenvolvedores que irão trabalhar no projeto.

## 1. Propósito do Projeto

Nesta seção, detalhamos o objetivo principal do projeto, o valor que ele oferece aos usuários e o problema que ele se propõe a resolver.

### 1.1 Objetivo Principal

O projeto é uma plataforma web interativa para gerenciar e consumir conteúdo organizado por tópicos. Seu objetivo principal é facilitar o acesso a conteúdo relevante e bem estruturado, enquanto oferece aos administradores ferramentas eficientes para gerenciar esse conteúdo.

### 1.2 Valor para o Usuário

Para o usuário final, a plataforma oferece:

*   **Acesso Fácil:** Conteúdo organizado e acessível.
*   **Navegação Intuitiva:** Interface simples para encontrar e consumir conteúdo.
*   **Conteúdo Atualizado:** Conteúdo gerenciado e atualizado regularmente pelos administradores.

### 1.3 Problema Resolvido

O projeto resolve o problema da desorganização de conteúdo e da dificuldade de acesso a informações específicas. Ele centraliza o conteúdo em uma plataforma única, facilitando a gestão e o consumo.
   
## 2. Tecnologias Utilizadas

Esta seção lista e descreve as tecnologias que foram utilizadas no desenvolvimento do projeto, tanto no frontend quanto no backend. Cada tecnologia é justificada pela sua escolha, destacando seus benefícios.



#### 2.1 Frontend (Client-Side)

*   **React (v18.2.0):** Biblioteca JavaScript para construir interfaces de usuário dinâmicas e reativas. Escolha baseada na sua vasta comunidade, reusabilidade de componentes e performance.
*   **TypeScript:** Superconjunto do JavaScript que adiciona tipagem estática, melhorando a manutenção e a qualidade do código.
*   **Vite:** Ferramenta de build que oferece um ambiente de desenvolvimento rápido e otimizações para produção. Foi escolhido pela sua velocidade e eficiência.
*   **Tailwind CSS:** Framework CSS utility-first que permite o desenvolvimento rápido de interfaces de usuário, mantendo a consistência.
*   **Firebase (v10.8.0):** Plataforma para banco de dados (Firestore), autenticação e hospedagem. Escolha baseada na facilidade de uso, escalabilidade e integração com o backend.

#### 2.2 Backend (Firebase Cloud Functions)

*   **Node.js:** Ambiente de execução JavaScript para execução de funções serverless, permitindo que o backend seja escrito na mesma linguagem do frontend.
*   **Firebase Cloud Functions:** Funções serverless que executam lógica de backend em resposta a eventos do Firebase, escalando automaticamente.

### Dependências
Nesta seção estão listadas as principais dependências do projeto, com suas respectivas versões, garantindo a clareza e a reprodução do ambiente de desenvolvimento.

Aqui estão as principais dependências do projeto, com suas respectivas versões:

<CODE_BLOCK>  
  "dependencies": {
      "@emotion/react": "^11.11.3",
      "@emotion/styled": "^11.11.0",
      "@mui/icons-material": "^5.15.10",
      "@mui/material": "^5.15.10",
      "firebase": "^10.8.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-router-dom": "^6.22.0"
  }
</CODE_BLOCK>

#### 2.3 Ferramentas de Desenvolvimento

*   **ESLint:** Garante a qualidade e consistência do código JavaScript e TypeScript.
*   **Prettier:** Formata o código automaticamente para manter um padrão consistente e legível.

## Estrutura do Projeto
  
### 3.1 Diretórios Principais

A organização do projeto em diretórios facilita a localização de arquivos e a compreensão da estrutura do projeto.

*   **`src/`:** Contém todo o código-fonte do frontend.
    *   **`App.tsx`:** Componente principal da aplicação.
    *   **`firebase.ts`:** Arquivo de configuração do Firebase.
    *   **`index.css`:** Estilos globais da aplicação.
    *   **`main.tsx`:** Ponto de entrada principal para o frontend.
    *   **`vite-env.d.ts`:** Definições de tipo para o ambiente Vite.
    *   **`context/`:** Contém os contextos de aplicação.
        *   **`AuthContext.tsx`:** Contexto para gestão de autenticação.
        *   **`ContentContext.tsx`:** Contexto para gestão de conteúdos.
    *   **`pages/`:** Contém as páginas da aplicação.
        *   **`ContentViewPage.tsx`:** Página para visualizar conteúdos.
        *   **`HomePage.tsx`:** Página inicial.
        *   **`LoginPage.tsx`:** Página de login.
        *   **`TopicPage.tsx`:** Página para visualizar um tópico específico.
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
            *   **`AuthForm.tsx`:** Formulário de autenticação.
        *   **`layout/`:** Componentes de layout.
            *   **`Header.tsx`:** Cabeçalho da aplicação.
            *   **`Layout.tsx`:** Componente de layout principal.
            *   **`Sidebar.tsx`:** Barra lateral de navegação.
        *   **`ui/`:** Componentes de interface do usuário.
            *   **`Button.tsx`:** Botão customizado.
            *   **`ConfirmDialog.tsx`:** Dialog de confirmação.
            *   **`Input.tsx`:** Input customizado.
    *    **`types/`**: Definições de tipos utilizados na aplicação.
        *    **`index.ts`**: Definições de tipos da aplicação.
*   **`functions/`:** Contém todo o código-fonte do backend (Cloud Functions).
    *   **`index.js`:** Ponto de entrada principal para as Cloud Functions.
    *   **`package.json`:** Dependencias do backend.
    *   **`package-lock.json`:** Dependencias do backend.
*   **`public/`:** Esta pasta não existe, mas é onde os arquivos estáticos seriam armazenados, como imagens e fontes. Como este projeto é feito com vite, arquivos estáticos ficam na pasta `src`.

## 4. Configuração Local

### 4.1 Pré-requisitos

Antes de começar, certifique-se de ter o seguinte instalado:

*   **Node.js (v18 ou superior):** Para executar o projeto frontend e backend.
*   **npm (geralmente instalado com Node.js) ou yarn:** Gerenciador de pacotes.
*   **Firebase CLI:** Para interagir com o Firebase.

### 4.2 Configurando o Frontend

1.  Navegue até a raiz do projeto.
2.  Instale as dependências:
    <CODE_BLOCK>
        npm install
    </CODE_BLOCK>
3. Crie um arquivo `.env` na raiz do projeto e preencha com as credenciais do firebase.
<CODE_BLOCK>
VITE_API_KEY="YOUR_API_KEY"
VITE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
VITE_PROJECT_ID="YOUR_PROJECT_ID"
VITE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
VITE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
VITE_APP_ID="YOUR_APP_ID"
</CODE_BLOCK>

### 4.3 Configurando o Backend

1.  Navegue até o diretório `functions/`.
2.  Instale as dependências:
    <CODE_BLOCK>
        npm install
    </CODE_BLOCK>
3.  Certifique-se de que o Firebase CLI está configurado e logado na sua conta Firebase.

### 4.4 Executando o Projeto

#### 4.4.1 Executando o Frontend

1.  Navegue até a raiz do projeto.
2.  Inicie o servidor de desenvolvimento:
    <CODE_BLOCK>
        npm run dev
    </CODE_BLOCK>

#### 4.4.2 Executando o Backend

1.  Navegue até o diretório `functions/`.
2.  Inicie o emulador do Firebase:
    <CODE_BLOCK>
        npm run serve
    </CODE_BLOCK>

## 5. Funcionalidades Principais

### 5.1 Autenticação de Usuários

*   Os usuários podem se autenticar usando um email e senha, por meio do `AuthForm.tsx`.
*   A autenticação é gerenciada pelo Firebase Authentication.
*    O contexto `AuthContext.tsx` controla as funções de autenticação.

### 5.2 Gestão de Conteúdo

#### 5.2.1 Tópicos

*   Administradores podem criar, editar e excluir tópicos.
*    Feito por meio da pagina `TopicManagementPage.tsx`.

#### 5.2.2 Conteúdo

*   Administradores podem criar, editar e excluir conteúdos dentro de tópicos específicos.
*    Feito por meio da pagina `ContentEditPage.tsx`.
*    A pagina `ContentViewPage.tsx` mostra os conteudos para o usuario.

### 5.3 Roles

#### 5.3.1 Usuário

*   Pode visualizar tópicos e conteúdos.

#### 5.3.2 Administrador

*   Pode gerenciar tópicos e conteúdos, bem como gerenciar usuários.

### 5.4 Gestão de Usuários

*   Administradores podem gerenciar usuários, como transformá-los em administradores ou removê-los.
*    Feito por meio da pagina `UserManagementPage.tsx`.

## 6. Organização do Conteúdo

*   O conteúdo é organizado por tópicos.
*   Cada tópico pode ter vários conteúdos.
*   O modelo de dados do Firestore consiste em coleções de `topics` e `contents`.

## 7. Contribuição

*   Para contribuir, faça um fork do projeto, crie uma branch para sua feature, faça as alterações e submeta um pull request.

## 8. Notas Adicionais

### 8.1 Relacionamento entre Frontend e Backend.

*   O frontend se comunica com o backend através da API do Firebase.
*    Alguns codigos são feitos diretamente no frontend, outros no backend.

### 8.2 Adicionar um usuario

*   Os usuários podem ser adicionados através do componente `AuthForm.tsx`.

### 8.3 Transformar um usuario em admin.

*   A transformação de um usuário comum em administrador é feita por meio da função `setAdminClaim.js` no terminal.


