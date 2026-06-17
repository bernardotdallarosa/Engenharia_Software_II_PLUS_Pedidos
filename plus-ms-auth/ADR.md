Trabalho 1 de ES2, Grupo 7

Integrantes: Jasmine Vanzella, Julia Fernandes, Luiza Rosito, Murilo Souza e Rafael Madeira 

# Documento de Decisão de Arquitetura do Backend - Projeto Plus Gestão

## 1. STATUS: Aceito

## 2. CONTEXTO
    
    O projeto Plus é um sistema de gestão de estoque para o nicho de vestuário plus size. Devido à sua complexidade (gestão de grades, medidas corporais detalhadas e múltiplos perfis de acesso), o sistema foi concebido para ser escalável. O desafio era evitar um "monólito distribuído", onde os serviços são separados, mas fortemente acoplados. A necessidade de independência entre as frentes de desenvolvimento e a facilidade de deploy isolado para correções rápidas em módulos críticos motivou a escolha por uma arquitetura distribuída em ambas as pontas (Front e Back).

    Este ADR documenta as decisões sobre microsserviços e microfrontends de autenticação e autorização, tecnologias e infraestrutura.

## 3. DECISÃO ARQUITETURAL

    Foi adotado um estilo Distribuído, combinando Microfrontends (MFE) e Microsserviços (MS).

    - FRONT-END: 

    O sistema é dividido em um Shell (Host), que gerencia o estado global, autenticação persistente e roteamento de alto nível, e Remotes (como o plus-mfe-auth), que são aplicações independentes que expõem componentes.

    O uso de TypeScript em todo o ecossistema de MFEs foi decidido para garantir a integridade dos contratos de dados entre o Shell e os Remotos, reduzindo erros de execução em tempo de carregamento dinâmico.

    Para garantir que o usuário não perceba a transição entre diferentes microfrontends, foi adotado o MUI como base. Isso permite que todos os MFEs compartilhem o mesmo tema definido no Shell, mantendo a consistência visual do projeto.

    Esse estilo arquitetural garante que o time responsável pela autenticação possa alterar o fluxo de login ou registro sem que o Shell precise ser recompilado ou sofra impacto colateral. Além disso, ao utilizar carregamento dinâmico (lazy loading), os módulos são carregados apenas quando o usuário acessa a rota específica, reduzindo o bundle size inicial e melhorando a performance percebida.
    
    - BACK-END: 
    
    Foi aplicado o padrão de Arquitetura em Camadas (Controllers, Services, Models/DTOs) para garantir a manutenibilidade. Além disso, foi feita Autenticação Stateless via JWT e a autorização foi baseada em níveis de acesso (RBAC), distinguindo permissões entre Administradores e Vendedores.
    
    Com essa arquitetura, se o serviço de autenticação sofrer muitos acessos, podemos escalar apenas ele, sem desperdiçar recursos com o módulo de relatórios, por exemplo. A separação em camadas permite, também, testes unitários isolados da lógica de negócio (Services) sem a necessidade de subir o servidor web ou o banco de dados. Além disso, possuí isolamento de falhas, em que um erro crítico no banco de dados de um serviço não derruba a disponibilidade dos demais.

## 4. FLUXO GERAL
    
    O navegador acessa o Shell (Porta 3000), que busca o manifesto remoteEntry.js do MFE Auth (Porta 4001). A partir disso, o Shell injeta o componente remoto LoginPage na tela do usuário. O usuário submete suas credenciais e o MFE Auth dispara um POST /auth/login para o Microsserviço de Auth (Porta 3001).

    O Microsserviço (Python/FastAPI) valida os dados no PostgreSQL e devolve um par de tokens JWT. O MFE sinaliza ao Shell que o usuário está autenticado, permitindo acesso ao Dashboard.

## 5. TECNOLOGIAS ADOTADAS

    - React 18 + TypeScript
    - Vite
    - Python 3.12 + FastAPI
    - PostgreSQL
    - SQLAlchemy
    - Material UI (MUI)
    - Docker

## 6. TRADE-OFFS

### 6.1. VANTAGENS

    - Manutenibilidade a longo prazo: A arquitetura em camadas no backend evita o "Big Ball of Mud" (código espaguete), tornando a entrada de novos desenvolvedores no projeto mais simples.

    - Desenvolvimento poliglota: A arquitetura de microsserviços permite que, se um futuro módulo de inteligência de dados for necessário, ele possa ser feito em outra linguagem sem afetar o MS-Auth.

### 6.2. DESVANTAGENS/RISCOS

    - Complexidade de Rede e Latência: Cada comunicação entre MFE e MS é um "salto" de rede. O gerenciamento de CORS torna-se uma tarefa constante e sensível.

    - Sobrecarga de Infraestrutura (Overhead): Rodar múltiplos containers Docker (um para o Shell, um para cada MFE, um para cada MS, um para cada DB) consome muito mais memória e CPU local do que uma aplicação única.

    - Consistência de Dependências: Existe o risco de "Dependency Hell" no front-end. Se o Shell usar React 18 e um remote tentar carregar o React 17, o sistema pode quebrar. Isso exige uma governança rígida no arquivo vite.config.js.

    - Rastreabilidade: Debugar um erro que começa no Shell, passa pelo MFE e termina no Banco de Dados exige ferramentas de log centralizadas e uma correlação clara de IDs de requisição.