const messages = {
  common_errors: {
    component_unauthorized: "No estás autorizado para usar este componente.",
    unknown_interaction: "Se encontró un tipo de interacción desconocido.",
    no_handler: "No se encontró ningún controlador para esta interacción.",
    generic: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.",
    invalid_params: "Parámetros inválidos recibidos para esta interacción.",
  },
  ping: {
    reply: "¡Pong! Latencia de la API: {{latency:number}}ms",
  },
  language: {
    select_placeholder: "Selecciona tu idioma preferido",
    select_label: "Idioma",
    modal_title: "Establece Tu Idioma",
    success_message: "¡Tu idioma ha sido actualizado correctamente {{flag:string}}!",
  },
} as const;

const commands = {
  commands: {
    ping: {
      name: "ping",
      description: "¡Responde con Pong!",
    },
    language: {
      name: "idioma",
      description: "Establece tu idioma preferido para el bot.",
    },
  },
} as const;

export const esES = {
  ...messages,
  ...commands,
} as const;
