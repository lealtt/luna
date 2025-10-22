const messages = {
  common_errors: {
    component_unauthorized: "Você não tem autorização para usar este componente.",
    unknown_interaction: "Um tipo de interação desconhecido foi encontrado.",
    no_handler: "Nenhum manipulador encontrado para esta interação.",
    generic: "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.",
    invalid_params: "Parâmetros inválidos recebidos para esta interação.",
  },
  ping: {
    reply: "Pong! Latência da API: {{latency:number}}ms",
  },
  language: {
    select_placeholder: "Selecione seu idioma preferido",
    select_label: "Idioma",
    modal_title: "Defina Seu Idioma",
    success_message: "Seu idioma foi atualizado com sucesso {{flag:string}}!",
  },
} as const;

const commands = {
  commands: {
    ping: {
      name: "ping",
      description: "Responde com Pong!",
    },
    language: {
      name: "idioma",
      description: "Define seu idioma preferido para o bot.",
    },
  },
} as const;

export const ptBR = {
  ...messages,
  ...commands,
} as const;
