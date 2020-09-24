## ServiceNow CI/CD Extension for Azure Pipelines




This extension allows integration of ServiceNow CI/CD functions into Azure Devops pipelines.

Extension itself contains tasks for the pipeline integration. These tasks can be found by its names, all names contain **ServiceNow CI/CD** substring and can be easily filtered through search. Tasks can be added both via classic editor and YAML editor.

Every SNCICD task requires ready and set up ServiceNow connection. Connections setup is available via *Manage* link near *ServiceNow endpoint* field (or via button "+ New")

In order to make kick-off easier we have created the template .yaml file for a common type of usage pipleline - [Example pipeline yaml](example-pipeline.html). It contains all available tasks in different variants of variables usage.

Please, pay attention. Every task's input can be skipped in the setup stage and the values can be passed via ENV variables. Also some tasks produce it's own variables output that can be used both in SNCICD and other tasks. The *AppPublish* task generates variable named `publishVersion` - it contains the version number of recently published app. *AppInstall* task uses this variable if any and produces `rollbackVersion` variable - the previous version of app on production server for rolling back all changes if any of tests goes falsy. And *AppRollback* task consumes this variable.

---

Here you can see the list of available tasks provided by this plugin:

- ServiceNow CI/CD Install Application
> Installs the specified application from the application repository onto the local instance

- ServiceNow CI/CD Publish Application
> Installs the specified application from the application repository onto the local instance

- ServiceNow CI/CD Rollback App
> Initiate a rollback of a specified application to a specified version.

- ServiceNow CI/CD add a plugin
> Activate a desired plugin on your ServiceNow instance

- ServiceNow CI/CD rollback a plugin
> Rollback a desired plugin on your ServiceNow instance

- ServiceNow CI/CD Apply Changes
> Apply changes from a remote source control to a specified local application

- ServiceNow CI/CD Start Test Suite
> Start a specified automated test suite.
 
---
