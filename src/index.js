import {
  intro,
  outro,
  select,
  text,
  confirm,
  multiselect,
  isCancel
} from '@clack/prompts'
import colors from 'picocolors'
import { trytm } from '@bdsqqq/try'

import { COMMIT_TYPES } from './commit-types.js'
import { getChangedFiles, getStagedFiles, gitCommit, gitAdd } from './git.js'
import { exitProgram } from './utils.js'

const [changedFiles, errorChangedFiles] = await trytm(getChangedFiles())
const [stagedFiles, errorStagedFiles] = await trytm(getStagedFiles())

intro(
  colors.inverse(
    `Asistente para la creación de commits por ${colors.yellow(
      ' carlos8_alb '
    )}`
  )
)

if (errorChangedFiles ?? errorStagedFiles) {
  exitProgram({
    code: 1,
    message: 'Error: Comprueba que estás en un repositorio de git.'
  })
}

if (stagedFiles.length === 0 && changedFiles.length > 0) {
  const files = await multiselect({
    message: colors.cyan(
      'Selecciona los ficheros que quieres añadir al commit:'
    ),
    options: changedFiles.map((file) => ({
      value: file,
      label: file
    }))
  })

  if (isCancel(files)) {
    exitProgram({
      code: 0,
      message: 'No hay archivos para commitear.'
    })
  }

  await gitAdd({ files })
}

const commitType = await select({
  message: colors.cyan('Selecciona el tipo de commit:'),
  options: Object.entries(COMMIT_TYPES).map(([key, value]) => ({
    value: key,
    label: `${value.emoji}  ${key.padEnd(5, ' ')} - ${value.description}`
  }))
})

if (isCancel(commitType)) {
  exitProgram({
    code: 0,
    message: 'No hay archivos para commitear.'
  })
}

const commitMessage = await text({
  message: colors.cyan('Introduce el mensaje del commit'),
  validate: (value) => {
    if (value.length === 0) {
      return colors.red('El mensaje no puede estar vacío.')
    }

    if (value.length > 50) {
      return colors.red('El mensaje no puede tener mas de 50 caracteres.')
    }
  }
})

if (isCancel(commitMessage)) {
  exitProgram({
    code: 0,
    message: 'No hay archivos para commitear.'
  })
}

const { emoji, release } = COMMIT_TYPES[commitType]

let breakingChange = false
if (release) {
  breakingChange = await confirm({
    initialValue: false,
    message: `¿Tiene este commit cambios que rompen la compatibilidad anterior?
      ${colors.yellow(
        'Si la respuesta es si, deberías crear un commit con el tipo "BREAKING CHANGE" y al hacer release se publicará una versión major'
      )}
    `
  })
}

if (isCancel(breakingChange)) {
  exitProgram({
    code: 0,
    message: 'No hay archivos para commitear.'
  })
}

let commit = `${emoji} ${commitType}: ${commitMessage}`
commit = breakingChange ? `${commit} [breaking change]` : commit

const shouldContinue = await confirm({
  initialValue: true,
  message: `${colors.cyan('¿Quieres crear el commit con el siguiente mensaje?')}
  ${colors.green(colors.bold(commit))}
  ${colors.cyan('¿Confimas?')}
  `
})

if (isCancel(shouldContinue)) {
  exitProgram({
    code: 0,
    message: 'No hay archivos para commitear.'
  })
}

if (!shouldContinue) {
  exitProgram({
    code: 0,
    message: 'No se ha creado el commit'
  })
}

await gitCommit({ commit })

outro(
  colors.green('✔ Commit creade con éxito. ¡Gracias por usar el asistente!')
)
