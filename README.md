# learnpack

Create, sell or download and take learning amazing learning packages.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/learnpack.svg)](https://npmjs.org/package/learnpack)
[![Downloads/week](https://img.shields.io/npm/dw/learnpack.svg)](https://npmjs.org/package/learnpack)
[![License](https://img.shields.io/npm/l/learnpack.svg)](https://github.com/learnpack/learnpack-cli/blob/master/package.json)

<!-- toc -->

- [learnpack](#learnpack)
- [Usage](#usage)
- [Commands](#commands)
<!-- tocstop -->

* [learnpack](#learnpack)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g @charlytoc/learnpack
$ learnpack COMMAND
running command...
$ learnpack (-v|--version|version)
@charlytoc/learnpack/2.2.0 win32-x64 node-v18.16.0
$ learnpack --help [COMMAND]
USAGE
  $ learnpack COMMAND
...
```

<!-- usagestop -->

```sh-session
$ npm install -g @learnpack/learnpack
$ learnpack COMMAND
running command...
$ learnpack (-v|--version|version)
@learnpack/learnpack/2.1.25 win32-x64 node-v16.14.0
$ learnpack --help [COMMAND]
USAGE
  $ learnpack COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`learnpack audit`](#learnpack-audit)
- [`learnpack clean`](#learnpack-clean)
- [`learnpack download [PACKAGE]`](#learnpack-download-package)
- [`learnpack help [COMMAND]`](#learnpack-help-command)
- [`learnpack init`](#learnpack-init)
- [`learnpack login [PACKAGE]`](#learnpack-login-package)
- [`learnpack logout [PACKAGE]`](#learnpack-logout-package)
- [`learnpack plugins`](#learnpack-plugins)
- [`learnpack plugins:install PLUGIN...`](#learnpack-pluginsinstall-plugin)
- [`learnpack plugins:link PLUGIN`](#learnpack-pluginslink-plugin)
- [`learnpack plugins:uninstall PLUGIN...`](#learnpack-pluginsuninstall-plugin)
- [`learnpack plugins:update`](#learnpack-pluginsupdate)
- [`learnpack publish [PACKAGE]`](#learnpack-publish-package)
- [`learnpack start`](#learnpack-start)
- [`learnpack test [EXERCISESLUG]`](#learnpack-test-exerciseslug)

## `learnpack audit`

learnpack audit is the command in charge of creating an auditory of the repository

```
USAGE
  $ learnpack audit

DESCRIPTION
  ...
  learnpack audit checks for the following information in a repository:
       1. The configuration object has slug, repository and description. (Error)
       2. The command learnpack clean has been run. (Error)
       3. If a markdown or test file doesn't have any content. (Error)
       4. The links are accessing to valid servers. (Error)
       5. The relative images are working (If they have the shortest path to the image or if the images exists in the
  assets). (Error)
       6. The external images are working (If they are pointing to a valid server). (Error)
       7. The exercises directory names are valid. (Error)
       8. If an exercise doesn't have a README file. (Error)
       9. The exercises array (Of the config file) has content. (Error)
       10. The exercses have the same translations. (Warning)
       11. The .gitignore file exists. (Warning)
       12. If there is a file within the exercises folder but not inside of any particular exercise's folder. (Warning)
```

_See code: [src\commands\audit.ts](https://github.com/learnpack/learnpack-cli/blob/v2.2.0/src\commands\audit.ts)_

## `learnpack clean`

Clean the configuration object

```
USAGE
  $ learnpack clean

DESCRIPTION
  ...
     Extra documentation goes here
```

_See code: [src\commands\clean.ts](https://github.com/learnpack/learnpack-cli/blob/v2.2.0/src\commands\clean.ts)_

## `learnpack download [PACKAGE]`

Describe the command here

```
USAGE
  $ learnpack download [PACKAGE]

ARGUMENTS
  PACKAGE  The unique string that identifies this package on learnpack

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src\commands\download.ts](https://github.com/learnpack/learnpack-cli/blob/v2.2.0/src\commands\download.ts)_

## `learnpack help [COMMAND]`

display help for learnpack

```
USAGE
  $ learnpack help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.1.0/src\commands\help.ts)_

## `learnpack init`

Create a new learning package: Book, Tutorial or Exercise

```
USAGE
  $ learnpack init

OPTIONS
  -h, --grading  show CLI help
```

_See code: [src\commands\init.ts](https://github.com/learnpack/learnpack-cli/blob/v2.2.0/src\commands\init.ts)_

## `learnpack login [PACKAGE]`

Describe the command here

```
USAGE
  $ learnpack login [PACKAGE]

ARGUMENTS
  PACKAGE  The unique string that identifies this package on learnpack

DESCRIPTION
  ...
     Extra documentation goes here
```

_See code: [src\commands\login.ts](https://github.com/learnpack/learnpack-cli/blob/v2.2.0/src\commands\login.ts)_

## `learnpack logout [PACKAGE]`

Describe the command here

```
USAGE
  $ learnpack logout [PACKAGE]

ARGUMENTS
  PACKAGE  The unique string that identifies this package on learnpack

DESCRIPTION
  ...
     Extra documentation goes here
```

_See code: [src\commands\logout.ts](https://github.com/learnpack/learnpack-cli/blob/v2.2.0/src\commands\logout.ts)_

## `learnpack plugins`

list installed plugins

```
USAGE
  $ learnpack plugins

OPTIONS
  --core  show core plugins

EXAMPLE
  $ learnpack plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.8.0/src\commands\plugins\index.ts)_

## `learnpack plugins:install PLUGIN...`

installs a plugin into the CLI

```
USAGE
  $ learnpack plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  plugin to install

OPTIONS
  -f, --force    yarn install with force flag
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ learnpack plugins:add

EXAMPLES
  $ learnpack plugins:install myplugin
  $ learnpack plugins:install https://github.com/someuser/someplugin
  $ learnpack plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.8.0/src\commands\plugins\install.ts)_

## `learnpack plugins:link PLUGIN`

links a plugin into the CLI for development

```
USAGE
  $ learnpack plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLE
  $ learnpack plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.8.0/src\commands\plugins\link.ts)_

## `learnpack plugins:uninstall PLUGIN...`

removes a plugin from the CLI

```
USAGE
  $ learnpack plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ learnpack plugins:unlink
  $ learnpack plugins:remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.8.0/src\commands\plugins\uninstall.ts)_

## `learnpack plugins:update`

update installed plugins

```
USAGE
  $ learnpack plugins:update

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.8.0/src\commands\plugins\update.ts)_

## `learnpack publish [PACKAGE]`

Describe the command here

```
USAGE
  $ learnpack publish [PACKAGE]

ARGUMENTS
  PACKAGE  The unique string that identifies this package on learnpack

DESCRIPTION
  ...
     Extra documentation goes here
```

_See code: [src\commands\publish.ts](https://github.com/learnpack/learnpack-cli/blob/v2.2.0/src\commands\publish.ts)_

## `learnpack start`

Runs a small server with all the exercise instructions

```
USAGE
  $ learnpack start

OPTIONS
  -D, --disableGrading                disble grading functionality
  -d, --debug                         debugger mode for more verbage
  -e, --editor=standalone|gitpod      [standalone, gitpod]
  -g, --grading=isolated|incremental  [isolated, incremental]
  -h, --host=host                     server host
  -p, --port=port                     server port
  -v, --version=version               E.g: 1.0.1
  -w, --watch                         Watch for file changes
```

_See code: [src\commands\start.ts](https://github.com/learnpack/learnpack-cli/blob/v2.2.0/src\commands\start.ts)_

## `learnpack test [EXERCISESLUG]`

Test exercises

```
USAGE
  $ learnpack test [EXERCISESLUG]

ARGUMENTS
  EXERCISESLUG  The name of the exercise to test
```

_See code: [src\commands\test.ts](https://github.com/learnpack/learnpack-cli/blob/v2.2.0/src\commands\test.ts)_

<!-- commandsstop -->

- [`learnpack audit`](#learnpack-audit)
- [`learnpack clean`](#learnpack-clean)
- [`learnpack download [PACKAGE]`](#learnpack-download-package)
- [`learnpack help [COMMAND]`](#learnpack-help-command)
- [`learnpack init`](#learnpack-init)
- [`learnpack login [PACKAGE]`](#learnpack-login-package)
- [`learnpack logout [PACKAGE]`](#learnpack-logout-package)
- [`learnpack plugins`](#learnpack-plugins)
- [`learnpack plugins:install PLUGIN...`](#learnpack-pluginsinstall-plugin)
- [`learnpack plugins:link PLUGIN`](#learnpack-pluginslink-plugin)
- [`learnpack plugins:uninstall PLUGIN...`](#learnpack-pluginsuninstall-plugin)
- [`learnpack plugins:update`](#learnpack-pluginsupdate)
- [`learnpack publish [PACKAGE]`](#learnpack-publish-package)
- [`learnpack start`](#learnpack-start)
- [`learnpack test [EXERCISESLUG]`](#learnpack-test-exerciseslug)

## `learnpack audit`

learnpack audit is the command in charge of creating an auditory of the repository

```
USAGE
  $ learnpack audit

DESCRIPTION
  ...
  learnpack audit checks for the following information in a repository:
       1. The configuration object has slug, repository and description. (Error)
       2. The command learnpack clean has been run. (Error)
       3. If a markdown or test file doesn't have any content. (Error)
       4. The links are accessing to valid servers. (Error)
       5. The relative images are working (If they have the shortest path to the image or if the images exists in the
  assets). (Error)
       6. The external images are working (If they are pointing to a valid server). (Error)
       7. The exercises directory names are valid. (Error)
       8. If an exercise doesn't have a README file. (Error)
       9. The exercises array (Of the config file) has content. (Error)
       10. The exercses have the same translations. (Warning)
       11. The .gitignore file exists. (Warning)
       12. If there is a file within the exercises folder but not inside of any particular exercise's folder. (Warning)
```

_See code: [src\commands\audit.ts](https://github.com/learnpack/learnpack-cli/blob/v2.1.25/src\commands\audit.ts)_

## `learnpack clean`

Clean the configuration object

```
USAGE
  $ learnpack clean

DESCRIPTION
  ...
     Extra documentation goes here
```

_See code: [src\commands\clean.ts](https://github.com/learnpack/learnpack-cli/blob/v2.1.25/src\commands\clean.ts)_

## `learnpack download [PACKAGE]`

Describe the command here

```
USAGE
  $ learnpack download [PACKAGE]

ARGUMENTS
  PACKAGE  The unique string that identifies this package on learnpack

DESCRIPTION
  ...
  Extra documentation goes here
```

_See code: [src\commands\download.ts](https://github.com/learnpack/learnpack-cli/blob/v2.1.25/src\commands\download.ts)_

## `learnpack help [COMMAND]`

display help for learnpack

```
USAGE
  $ learnpack help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.1.0/src\commands\help.ts)_

## `learnpack init`

Create a new learning package: Book, Tutorial or Exercise

```
USAGE
  $ learnpack init

OPTIONS
  -h, --grading  show CLI help
```

_See code: [src\commands\init.ts](https://github.com/learnpack/learnpack-cli/blob/v2.1.25/src\commands\init.ts)_

## `learnpack login [PACKAGE]`

Describe the command here

```
USAGE
  $ learnpack login [PACKAGE]

ARGUMENTS
  PACKAGE  The unique string that identifies this package on learnpack

DESCRIPTION
  ...
     Extra documentation goes here
```

_See code: [src\commands\login.ts](https://github.com/learnpack/learnpack-cli/blob/v2.1.25/src\commands\login.ts)_

## `learnpack logout [PACKAGE]`

Describe the command here

```
USAGE
  $ learnpack logout [PACKAGE]

ARGUMENTS
  PACKAGE  The unique string that identifies this package on learnpack

DESCRIPTION
  ...
     Extra documentation goes here
```

_See code: [src\commands\logout.ts](https://github.com/learnpack/learnpack-cli/blob/v2.1.25/src\commands\logout.ts)_

## `learnpack plugins`

list installed plugins

```
USAGE
  $ learnpack plugins

OPTIONS
  --core  show core plugins

EXAMPLE
  $ learnpack plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.8.0/src\commands\plugins\index.ts)_

## `learnpack plugins:install PLUGIN...`

installs a plugin into the CLI

```
USAGE
  $ learnpack plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  plugin to install

OPTIONS
  -f, --force    yarn install with force flag
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ learnpack plugins:add

EXAMPLES
  $ learnpack plugins:install myplugin
  $ learnpack plugins:install https://github.com/someuser/someplugin
  $ learnpack plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.8.0/src\commands\plugins\install.ts)_

## `learnpack plugins:link PLUGIN`

links a plugin into the CLI for development

```
USAGE
  $ learnpack plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLE
  $ learnpack plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.8.0/src\commands\plugins\link.ts)_

## `learnpack plugins:uninstall PLUGIN...`

removes a plugin from the CLI

```
USAGE
  $ learnpack plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ learnpack plugins:unlink
  $ learnpack plugins:remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.8.0/src\commands\plugins\uninstall.ts)_

## `learnpack plugins:update`

update installed plugins

```
USAGE
  $ learnpack plugins:update

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.8.0/src\commands\plugins\update.ts)_

## `learnpack publish [PACKAGE]`

Describe the command here

```
USAGE
  $ learnpack publish [PACKAGE]

ARGUMENTS
  PACKAGE  The unique string that identifies this package on learnpack

DESCRIPTION
  ...
     Extra documentation goes here
```

_See code: [src\commands\publish.ts](https://github.com/learnpack/learnpack-cli/blob/v2.1.25/src\commands\publish.ts)_

## `learnpack start`

Runs a small server with all the exercise instructions

```
USAGE
  $ learnpack start

OPTIONS
  -D, --disableGrading                disble grading functionality
  -d, --debug                         debugger mode for more verbage
  -e, --editor=standalone|gitpod      [standalone, gitpod]
  -g, --grading=isolated|incremental  [isolated, incremental]
  -h, --host=host                     server host
  -p, --port=port                     server port
  -v, --version=version               E.g: 1.0.1
  -w, --watch                         Watch for file changes
```

_See code: [src\commands\start.ts](https://github.com/learnpack/learnpack-cli/blob/v2.1.25/src\commands\start.ts)_

## `learnpack test [EXERCISESLUG]`

Test exercises

```
USAGE
  $ learnpack test [EXERCISESLUG]

ARGUMENTS
  EXERCISESLUG  The name of the exercise to test
```

_See code: [src\commands\test.ts](https://github.com/learnpack/learnpack-cli/blob/v2.1.25/src\commands\test.ts)_

<!-- commandsstop -->
