module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Increase header max length for detailed commit messages
    'header-max-length': [2, 'always', 100],

    // Ensure type is always lowercase
    'type-case': [2, 'always', 'lower-case'],

    // Ensure scope is always lowercase
    'scope-case': [2, 'always', 'lower-case'],

    // Ensure subject starts with lowercase
    'subject-case': [2, 'always', 'lower-case'],

    // Prevent period at end of subject
    'subject-full-stop': [2, 'never', '.'],

    // Ensure subject is not empty
    'subject-empty': [2, 'never'],

    // Valid types for commits
    'type-enum': [
      2,
      'always',
      [
        'feat', // A new feature
        'fix', // A bug fix
        'docs', // Documentation only changes
        'style', // Changes that do not affect the meaning of the code
        'refactor', // A code change that neither fixes a bug nor adds a feature
        'perf', // A code change that improves performance
        'test', // Adding missing tests or correcting existing tests
        'build', // Changes that affect the build system or external dependencies
        'ci', // Changes to our CI configuration files and scripts
        'chore', // Other changes that don't modify src or test files
        'revert', // Reverts a previous commit
      ],
    ],
  },
};
