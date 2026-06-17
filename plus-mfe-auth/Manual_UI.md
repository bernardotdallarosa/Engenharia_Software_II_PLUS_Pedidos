Trabalho 1 de ES2, Grupo 7

Integrantes: Jasmine Vanzella, Julia Fernandes, Luiza Rosito, Murilo Souza e Rafael Madeira 

# UI Style Guide (Manual de UI) - Projeto Plus Gestão

Este documento estabelece as diretrizes visuais e de interface para o frontend do microserviço **Plus Gestão**. O objetivo é manter a consistência visual, acessibilidade e uma experiência de usuário moderna e limpa.

## 1. Identidade Visual

### 1.1 Paleta de Cores
A interface utiliza tons de roxo vibrante para ações principais e tons de cinza azulado para textos secundários e superfícies.

| Tipo | Cor | HEX | Uso |
| :--- | :--- | :--- | :--- |
| **Primary Main** | Purple | `#6C63FF` | Botões principais, ícones de sucesso, foco. |
| **Primary Dark** | Dark Purple | `#5A52E0` | Hover de botões, estados ativos. |
| **Primary Light**| Light Purple | `#EAE9FF` | Backgrounds suaves, badges. |
| **Background** | Gradient | `linear-gradient(135deg, #7B74F5 0%, #5E56E8 100%)` | Fundo principal das telas de Auth e Dash. |
| **Text Primary** | Deep Ink | `#3D3D6B` | Títulos e corpo de texto principal. |
| **Text Secondary**| Cool Grey | `#9898B3` | Labels, textos de ajuda e placeholders. |
| **Error** | Red | `#E05252` | Mensagens de validação e banners de erro. |
| **Surface** | Glass White | `rgba(248, 248, 255, 0.93)` | Cards principais com efeito Blur. |

### 1.2 Background Dinâmico
Para evitar interfaces "chapadas", utilizamos **Background Blobs** (círculos abstratos) em camadas de opacidade baixa (9% a 13%) para criar profundidade.

## 2. Tipografia

O sistema utiliza uma hierarquia clara com foco em legibilidade.

- **Fonte Principal:** `Nunito`, `Inter` ou sans-serif.
- **Títulos (h2/h4):** Peso `700` ou `800`. Cor `#4A42C8`.
- **Corpo de Texto:** Tamanho padrão `14pt`.
- **Labels de Input:** Tamanho `0.75rem`, Peso `600`, Uppercase/Capitalize.

## 3. Componentes Padrão

### 3.1 Botões (Buttons)
Os botões seguem o estilo "Pill" (totalmente arredondados).

* **Contained:** Gradiente de `#6C63FF` para `#7B74F5`. Shadow suave na cor da marca.
* **Outlined:** Borda fina `#E0E0F0`, fundo branco, texto roxo.
* **Glass (Header):** `background: rgba(255,255,255,0.12)`, borda semi-transparente e `backdropFilter: blur(10px)`.

### 3.2 Campos de Entrada (Underline Fields)
Diferente do padrão "Outlined" do MUI, usamos o estilo **Underline**:
* Linha base discreta (`#D0D0E8`).
* Transição para roxo no foco.
* Feedback visual de sucesso com ícone `CheckCircleIcon` no lado direito.

### 3.3 Containers (Paper)
Os cartões centrais de conteúdo devem ter:
* `borderRadius: "24px"`
* `backdropFilter: "blur(16px)"`
* `boxShadow: "0 8px 48px rgba(70, 60, 200, 0.22)"`

## 4. Layout e Spacing

* **Grid:** Utilizar o `<Container maxWidth="md">` para dashboards e `maxWidth: 460` para formulários de autenticação.
* **Padding:** Padronizar espaçamento interno de cards com `p: 4` (32px) ou `p: 6` (48px) em telas de sucesso.
* **Responsividade:** Em dispositivos móveis (`xs`), reduzir o padding para evitar perda de área útil.

## 5. UX - Fluxos e Feedback

1.  **Estados de Carregamento:** Sempre exibir `<CircularProgress />` centralizado ao buscar dados da API.
2.  **Validação:** Erros devem ser exibidos imediatamente abaixo do campo em vermelho.
3.  **Sucesso:** Após ações críticas (como Login), utilizar a tela de `SuccessPage` com o componente `<Zoom />` para dar feedback positivo antes do redirecionamento.
4.  **Empty States:** Tabelas vazias devem exibir uma mensagem centralizada informando "Nenhum dado encontrado".

## 6. Implementação (MUI Theme)

Para garantir que os componentes sigam este manual automaticamente, o tema deve ser configurado no `theme.ts`:

```typescript
// Exemplo de configuração de bordas e textos
shape: { borderRadius: 12 },
components: {
  MuiButton: {
    styleOverrides: {
      root: { borderRadius: 50, textTransform: 'none', fontWeight: 700 }
    }
  }
}