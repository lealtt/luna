const messages = {
  common_errors: {
    component_unauthorized: "You are not authorized to use this component.",
    unknown_interaction: "An unknown interaction type was encountered.",
    no_handler: "No handler found for this interaction.",
    generic: "An unexpected error occurred. Please try again later.",
    invalid_params: "Invalid parameters received for this interaction.",
  },
  ping: {
    reply: "Pong! API Latency: {{latency:number}}ms",
  },
  language: {
    select_placeholder: "Select your preferred language",
    select_label: "Language",
    modal_title: "Set Your Language",
    success_message: "Your language has been updated successfully {{flag:string}}!",
  },
  showcase: {
    title: "V2 Component Showcase",
    description: "This demonstrates various V2 components available.",
    thumbnail_desc: "User Avatar",
    gallery_item_desc: "Bot Avatar",
    button_primary: "Primary Button",
    button_secondary: "Secondary Button",
    file_title: "Attached File:",
  },
} as const;

const commands = {
  commands: {
    ping: {
      name: "ping",
      description: "Replies with Pong!",
    },
    language: {
      name: "language",
      description: "Set your preferred language for the bot.",
    },
  },
} as const;

export const enUS = {
  ...messages,
  ...commands,
} as const;
