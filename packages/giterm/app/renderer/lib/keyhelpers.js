export function CtrlOrCmdHeld(e) {
  return process.platform === 'darwin' ? e.metaKey : e.ctrlKey
}
