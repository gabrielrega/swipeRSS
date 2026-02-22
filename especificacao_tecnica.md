📄 Documento de Requisitos de Produto (PRD) e Implementação Técnica



Projeto: SwipeRSS

Plataforma: Web Application / PWA (Mobile-First)

Foco: Triagem rápida de RSS baseada em gestos e leitura offline limpa.



1\. Visão Geral



O SwipeRSS é um cliente de RSS focado na eliminação do "cansaço de decisão" e da acumulação de feeds. Utiliza uma interface baseada em cartões (estilo Tinder) para triagem rápida e um modo de leitura imersivo, offline e sem distrações para os artigos guardados.



2\. Arquitetura do Sistema



A aplicação funciona como um Frontend "inteligente" acoplado a um Backend "burro" (headless).



Motor de RSS (Backend): Instância do Miniflux (API REST). O Miniflux é estritamente responsável por subscrever os feeds (XML), fazer o fetch periódico via cron e armazenar os dados brutos.



Aplicação (Frontend): Single Page Application (SPA) transformada em PWA para permitir instalação no telemóvel e execução de processos em segundo plano.



Armazenamento Local: IndexedDB gerido pela aplicação para guardar os textos completos dos artigos para leitura offline.



Expansão Futura: A gestão de utilizadores, partilha de artigos com o grupo de RPG e listas colaborativas poderão ser migradas para o Firebase Firestore numa Fase 2.



3\. Regras de Negócio Centrais (Core Rules)



Limpeza Automática (Regra dos 14 Dias): \* No arranque da aplicação ou ao sincronizar, qualquer artigo não lido com data de publicação superior a 14 dias deve ser ignorado pela UI e marcado automaticamente como "lido" (read) na API do Miniflux através de um pedido em lote (batch).



Modo Leitura e Offline-First (Full-Text Extraction):



Quando um artigo é guardado ("Read Later"), a aplicação não guarda apenas o resumo. Faz um fetch à URL original do artigo (passando por um CORS Proxy), utiliza a biblioteca @mozilla/readability para extrair o HTML limpo (apenas texto principal e imagens, sem anúncios/menus) e guarda este conteúdo no IndexedDB.



Ciclo de Vida do Artigo Guardado:



A ação "Concluir Leitura" deve remover o artigo do IndexedDB local e enviar um pedido à API do Miniflux para remover o marcador de favorito (unstar) e marcá-lo como lido.



4\. UI/UX e Mapeamento de Gestos



A interface é composta por três vistas (Views) principais:



View 1: A Pilha de Triagem (Main Deck)



Cartão centralizado exibindo imagem de destaque, título, nome do feed, data e um breve resumo.



👆 Swipe Esquerda (Descartar): Marca como lido na API e remove da pilha.



👇 Swipe Direita (Ler Mais Tarde): Marca como favorito na API e inicia a extração de texto em background para o IndexedDB.



⬆️ Swipe Cima (Pular/Para o Fim): Ignora por agora. Move o artigo do topo do array para o final do array na memória da aplicação (não afeta a API).



View 2: Fila de Leitura (Saved/Offline List)



Lista vertical simples dos artigos salvos.



Mostra feedback visual do estado de extração: "A extrair texto..." (spinner) ou "Pronto para Offline" (ícone de verificação).



View 3: Modo de Leitura (Reader View)



Ecrã completo, tipografia serifa otimizada para leitura (estilo e-reader), fundo neutro.



Renderiza o HTML limpo armazenado localmente (dangerouslySetInnerHTML limpo via DOMPurify).



👉 Edge Swipe Direita (Voltar): Um deslizar para a direita no ecrã inteiro descarta a vista de leitura e regressa à lista, imitando a navegação nativa do iOS/Android. Cancela-se automaticamente se o gesto for predominantemente vertical (scroll de leitura).



Botão inferior: "Concluir Leitura" (elimina dados).



5\. Endpoints da API Miniflux (Integração)



Autenticação: Header X-Auth-Token: <API\_KEY>



Buscar Pilha: GET /v1/entries?status=unread\&direction=desc\&limit=100



Marcar como Lido (Swipe Esquerda / Regra 14 dias): PUT /v1/entries -> Body: {"entry\_ids": \[id1, id2], "status": "read"}



Guardar (Swipe Direita): PUT /v1/entries/\[id]/bookmark



6\. Stack Tecnológico Sugerido



Para o agente/CLI estruturar o projeto, devem ser utilizadas as seguintes bibliotecas:



Framework: React (Vite) ou Next.js.



Estilização: Tailwind CSS (crucial para o layout mobile-first flexível).



Física de Gestos: framer-motion ou implementação customizada (como no protótipo) com eventos de ponteiro (onPointerDown, Move, Up).



Armazenamento de Dados: Dexie.js (Wrapper para o IndexedDB simplificar o modo offline).



Extração de Conteúdo: \* @mozilla/readability (para o parsing do DOM da notícia).



isomorphic-dompurify (para evitar ataques XSS ao renderizar o HTML da notícia).



Ícones: lucide-react.



7\. Instruções para o Agente CLI (Fases de Implementação)



Fase 1: Setup e UI Base



Inicializar o projeto com Tailwind e configurar as variáveis de ambiente (URL do Miniflux e API Key).



Criar o Layout Base (Bottom Navigation, Cabeçalho).



Implementar a lógica do Cartão Arrastável (SwipeCard) suportando os eixos X e Y.



Fase 2: Integração e Lógica

4\.  Criar os serviços de API (minifluxService.js) para ligar ao backend.

5\.  Implementar o useEffect que carrega as notícias e aplica a filtragem e limpeza automática das com mais de 14 dias (date-fns).



Fase 3: O Motor Offline

6\.  Configurar a base de dados local com o Dexie.js (Tabela: saved\_articles).

7\.  Criar um Worker ou função assíncrona que: dado um URL, usa um proxy CORS, faz o fetch do HTML original, cria um DOM virtual no navegador, corre o Readability e guarda o objeto final no Dexie.js.



Fase 4: Leitura e Polimento

8\.  Implementar o ReaderView com a física de fechar com "Swipe to Back".

9\.  Configurar o manifesto PWA para permitir instalação no telemóvel.

