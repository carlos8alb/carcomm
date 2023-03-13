import { outro } from '@clack/prompts'
import colors from 'picocolors'

export function exitProgram({
  code = 0,
  message = 'No se ha creado el commit.'
} = {}) {
  outro(colors.red(message))
  process.exit(code)
}
