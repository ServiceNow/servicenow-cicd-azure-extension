ServiceNow CI/CD Extension for Azure Pipelines
===================

[![Documentation](https://img.shields.io/github/release/ServiceNow/servicenow-cicd-azure-extension.svg?label=Documentation&color=blueviolet)](https://marketplace.visualstudio.com/items?itemName=ServiceNow.vss-services-servicenow-cicd)
[![GitHub release](https://img.shields.io/github/release/ServiceNow/servicenow-cicd-azure-extension.svg?label=Release)](https://github.com/ServiceNow/servicenow-cicd-azure-extension/releases/latest)
[![Contributors](https://img.shields.io/github/contributors/ServiceNow/servicenow-cicd-azure-extension.svg)](https://github.com/ServiceNow/servicenow-cicd-azure-extension/graphs/contributors)

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

This extension is [published on the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=ServiceNow.vss-services-servicenow-cicd) to help Now Platform application developers get started faster in setting up CI/CD pipelines using Azure Pipelines. Please see the extension landing page for more instructions on how to get set up. 

## Installation
```shell script
git clone https://github.com/ServiceNow/servicenow-cicd-azure-extension.git
cd servicenow-cicd-azure-extension
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

All the API calls are made corresponding with ServiceNow [REST API documentation](https://developer.servicenow.com/dev.do#!/reference/api/quebec/rest/cicd-api). Extension covers all the endpoints mentioned there. Some of endpoints have no separate task in extension's because of helper nature of these endpoint i.e. progress API.

## Tasks

- Apply Remote Changes (from Source Control linked Git Repo)
> Apply changes from a remote source control to a specified local application

- Publish Application
> Publishes the specified application and all of its artifacts to the application repository. Different modes for choosing the version to publish are available, selectable as parameters.  
> - __versionFormat__: 
>   - __exact__: Use the version specified in the 'version' parameter
>   - __template__: Use the specified version template (x.y) in the 'versionTemplate' parameter with an auto-generated appended z value based on the build number
>   - __detect__: Detect the version of the application from XML file in Git repo. Use the 'isAppCustomization' parameter to indicate whether this should check for the version from the sys_app_{id}.xml or sys_app_customization_{id}.xml file. Will fail if no sources found
>   - __detect_without_autoincrement__: Detect the version of the application from XML file in Git repo, and do not auto increment
>   - __autodetect__: Detect the currently installed version from the instance's sys_app or sys_app_customization table on instance. (Use 'isAppCustomization' parameter to set which type of application this is.) This feature uses a Table API call, which requires a user with the necessary privileges on the instance. For example, by default `sn_cicd.sys_ci_automation` will not be sufficient. The `sys_app` and `sys_app_customization` table permissions can be updated to address this. 
> - __version__: Provide a version in the form x.y.z for the 'exact' versionFormat mode
> - __versionTemplate__: Provide a version template in the form x.y for the 'template' versionFormat mode. (Final versions are in x.y.z form)
> - __incrementBy__: {_integer_ n} Use this parameter to set up auto-incrementing for your pipeline in the form x.y.z+n
> - __isAppCustomization__: {Yes, No} This parameter is necessary for detecting the Application Customization version properly, from either Git repo XML file or from the table from your instance. It's important to note that the 'isAppCustomization' flag requires providing sys_id instead of scope! 

- Install Application
> Installs the specified application from the application repository onto the local instance

- Rollback Application
> Initiate a rollback of a specified application to a specified version.

- Activate Plugin
> Activate a desired plugin on ServiceNow instance

- Rollback Plugin
> Rollback a desired plugin on ServiceNow instance

- Start ATF Test Suite
> Start a specified automated test suite. 

## Support Model

ServiceNow built this integration with the intent to help customers get started faster in adopting CI/CD APIs for DevOps workflows, but __will not be providing formal support__. This integration is therefore considered "use at your own risk", and will rely on the open-source community to help drive fixes and feature enhancements via Issues. Occasionally, ServiceNow may choose to contribute to the open-source project to help address the highest priority Issues, and will do our best to keep the integrations updated with the latest API changes shipped with family releases. This is a good opportunity for our customers and community developers to step up and help drive iteration and improvement on these open-source integrations for everyone's benefit. 

## Governance Model

Initially, ServiceNow product management and engineering representatives will own governance of these integrations to ensure consistency with roadmap direction. In the longer term, we hope that contributors from customers and our community developers will help to guide prioritization and maintenance of these integrations. At that point, this governance model can be updated to reflect a broader pool of contributors and maintainers. 
