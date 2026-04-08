const ESCAPE_COMMANDS = [
  'cancelar', 'sair', 'voltar', 'parar', 'abort', 
  'menu', 'início', 'inicio', 'reiniciar', 'ignorar'
];

export function checkEscapeCommand(message: string): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase().trim();
  return ESCAPE_COMMANDS.includes(normalized);
}
