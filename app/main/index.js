import { app, crashReporter } from 'electron'
import createAppWindow from './createAppWindow'
import path from 'path'

crashReporter.start({
  productName: 'YourName',
  companyName: 'YourCompany',
  submitURL: 'https://your-domain.com/url-to-submit',
  uploadToServer: false,
})

let mainWindow = null
app.on('ready', async () => {
  mainWindow = await createAppWindow()

  mainWindow.loadURL(
    `file://${path.resolve(path.join(__dirname, '../renderer/index.html'))}`,
  )
})
