import path from 'path'

it('opens', () => {
  cy.electronVisitUrl(
    `${path.resolve(path.join(__dirname, '../../main/createAppWindow.js'))}`,
    `file://${path.resolve(path.join(__dirname, '../../renderer/index.html'))}`,
  )

  cy.get('body').should('exist')
})
