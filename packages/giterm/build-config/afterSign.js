exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context

  if (electronPlatformName === 'darwin' && !process.env.E2E) {
    const { notarize } = require('electron-notarize')
    const appName = context.packager.appInfo.productFilename

    return await notarize({
      appBundleId: 'com.nicklucas.giterm',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLEID,
      appleIdPassword: process.env.APPLEIDPASS,
    })
  }
}
