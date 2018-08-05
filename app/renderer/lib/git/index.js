
export function loadAllCommits() {
  return Promise.resolve([
    {
      sha: '1234',
      message: 'change the filange to eradicate the rumbling',
    },
    { sha: '5678', message: 'fix typos' },
    {
      sha: '4334',
      message:
        'add new project type in order to reverse the polarity of the neutron flow',
    },
  ])
}