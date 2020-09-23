# ServiceNow CI/CD plugin for Azure Devops pipelines

## Contents

- [Intro](#intro)
- [Installation](#installation)
- [Tests](#tests)
- [Build](#build)
- [Integration](#Integration)
- [API Docs](#api-docs)
- [List of tasks](#tasks)

---

## Intro

Here you can find the sourcecode of ServiceNow's extension for the Azure Devops pipelines.
This extension covers only CI/CD subset of ServiceNow REST API and it aims to help people integrate both Continues Integration and Continues Delivery into Azure pipelines infrastructure.

## Installation
```shell script
git clone git@github.com:antonmalyi/cicdplugin.git
cd cicdplugin
npm install
```

### Requirements
- nodejs ver >=8.0
### DevDependecies
- [jest](https://github.com/facebook/jest)
### Dependencies
- [archiver](https://github.com/archiverjs/node-archiver)
- [fs-extra](https://github.com/jprichardson/node-fs-extra)

## Tests

Project contains the [tests](tests/) folder. Inside are two files with mocks - [pipeline.js](tests/pipeline.js) and [transport.js](tests/transport.js) - pipeline emulates the AzureDevops pipeline inputs and variables, and transport have a mock for a ServiceNow API calls, it consumes the jsons generated from real server responses. The third file in the root of tests is [integration.test.js](tests/integration.test.js). This one emulates the whole pipeline's inputs from ADO and works as a pipeline itself, sending the requests for real ServiceNow server. The integration tests is required before building the extension artifact.

The tests folder contains also subfolders with tests and mock-data jsons. These are the unit tests for existing endpoints and for correct error processing like 404s.

Tests should be ran via npm commands:

#### Unit tests
```shell script
npm run test
```   

#### Integration test
```shell script
npm run integration
```   

> Note: The Rollback Plugin task will sometimes fails on ServiceNow instances despite a previously successful response to a Plugin Activate task. You can retry the test suite and hope the flakiness disappears and the tests pass. Also, the Apply Changes task in the integration tests is temporarily commented out while differences in behavior between the API and UI for Apply Remote Changes in an instance (Orlando or Paris) are being resolved. 

## Build

```shell script
npm run build
```

This command will check the latest version among all the tasks jsons an extension' manifest file, update every one with the latest, copy all necessary files and folders into folder 'out' and generate the .vsix file with name `servicenow.extension.x.y.z.vsix` where x.y.z is the current version of extension. This file is ready to upload into the marketplace.

File [extension.vsixmanifest](src/extension/extension.vsixmanifest) contains the info about Extension, it's publisher, version, name and description. If you start a **fork** - make sure you have changed this to corresponding publisher and dropped the version to 1.0.0 here and in every `task.json` file. 

## Integration

This project contains [azure-pipeline.yml](azure-pipelines.yml) file - when this repository added into ADO as a pipeline source, it will automatically create a pipeline, triggered by changes in `master` branch. It will install dependencies, run the Unit and Integration test and on success it will build and publish the artifact mentioned in [Build](#build) section.

## API docs

All the API calls are made corresponding with ServiceNow [REST API documentation](https://developer.servicenow.com/dev.do#!/reference/api/orlando/rest/cicd-api). Extension covers all the endpoints mentioned there. Some of endpoints have no separate task in extension's because of helper nature of these endpoint i.e. progress API.

## Tasks

- Apply SourceControl Changes
> Apply changes from a remote source control to a specified local application

- Publish Application
> Installs the specified application from the application repository onto the local instance

- Install Application
> Installs the specified application from the application repository onto the local instance

- Rollback App
> Initiate a rollback of a specified application to a specified version.

- Add a plugin
> Activate a desired plugin on ServiceNow instance

- Rollback a plugin
> Rollback a desired plugin on ServiceNow instance

- Start Test Suite
> Start a specified automated test suite. 


