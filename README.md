# SwipeRSS

Cliente de RSS mobile-first com interface de cartões para triagem rápida e leitura offline. Conecta a uma instância [Miniflux](https://miniflux.app/) e permite salvar artigos com extração de texto completo para leitura sem internet.

## Funcionalidades

- **Triagem por gestos** — swipe esquerda (descartar), direita (salvar), cima (pular para o fim)
- **Leitura offline** — extrai o conteúdo completo do artigo via CORS proxy + Readability e armazena no IndexedDB
- **Limpeza automática** — artigos com mais de 14 dias são marcados como lidos automaticamente no Miniflux
- **PWA** — instalável no celular, com manifest configurado

## Pré-requisitos

- Node.js 20+
- Instância Miniflux com API habilitada
- CORS proxy acessível (ex: `cors-anywhere` em self-host)

## Configuração

Copie `.env.example` para `.env` e preencha:

```env
VITE_MINIFLUX_URL=https://seu-miniflux.example.com
VITE_MINIFLUX_API_KEY=sua_api_key_aqui
VITE_CORS_PROXY_URL=https://seu-cors-proxy.example.com/
```

> **Atenção:** nunca exponha a API key em repositório público.

## Desenvolvimento

```bash
npm install
npm run dev
```

```bash
npm run build    # build de produção
npm run preview  # servir o build localmente
npm run lint     # ESLint
```

## Estrutura

```
src/
├── components/
│   ├── SwipeCard.tsx      # Cartão arrastável com framer-motion
│   ├── SavedList.tsx      # Fila de leitura offline (Dexie live query)
│   └── ReaderView.tsx     # Modo leitura full-screen com swipe para fechar
├── services/
│   ├── minifluxService.ts # Integração com a API REST do Miniflux
│   └── offlineService.ts  # Extração de conteúdo e persistência no IndexedDB
├── db.ts                  # Schema Dexie (tabela saved_articles)
└── App.tsx                # Roteamento entre views (deck / list / reader)
```

## Arquitetura

```
Miniflux (backend RSS) ──► minifluxService ──► SwipeCard deck
                                                    │
                                         swipe direita (salvar)
                                                    │
                                          offlineService
                                        CORS proxy ► Readability ► DOMPurify
                                                    │
                                               IndexedDB (Dexie)
                                                    │
                                         SavedList ► ReaderView
```

## Stack

| Camada | Biblioteca |
|--------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Estilo | Tailwind CSS v4 |
| Gestos/animações | Framer Motion |
| Armazenamento local | Dexie.js (IndexedDB) |
| Extração de conteúdo | @mozilla/readability + isomorphic-dompurify |
| HTTP | Axios |
| Datas | date-fns |
| Ícones | lucide-react |
| PWA | vite-plugin-pwa |
| Backend RSS | Miniflux (self-hosted) |

## API Miniflux utilizada

| Operação | Endpoint |
|----------|---------|
| Buscar não lidos | `GET /v1/entries?status=unread&direction=desc&limit=100` |
| Marcar como lido | `PUT /v1/entries` `{"entry_ids": [...], "status": "read"}` |
| Favoritar (salvar) | `PUT /v1/entries/{id}/bookmark` |

Autenticação: header `X-Auth-Token`.
