module.exports = {
  env: {
    browser: true,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'child_process',
                message:
                  'No child_process in renderer due to performance problems. Use or expand the IPC worker found in /app/main',
              },
            ],
          },
        ],
      },
    },
  ],
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['app', __dirname],
          ['main', __dirname + '/../main'],
        ],
      },
    },
  },
}
