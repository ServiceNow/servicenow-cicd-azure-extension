# ServiceNow CI/CD Extension for Azure Pipelines

## Contents

- [Intro](#intro)
- [Usage](#usage)
- [API Docs](#api-docs)
- [List of Build Steps](#build-steps)

---

## Intro

This repo contains an example pipeline template for setting up your GitLab CI/CD pipeline for developing applications on the Now Platform. Hop over to the example template directly: [example-cicd-pipeline](example-cicd-pipeline.yml).

The included template utilizes a [Docker image](https://hub.docker.com/r/servicenowdevx/sncicd-gitlab-docker) that provides the build steps for the pipeline. The source for the Docker image can be found at this [GitHub repository](https://github.com/ServiceNow/sncicd-gitlab-docker). 

The build steps are API wrappers for the [CI/CD APIs](https://developer.servicenow.com/dev.do#!/reference/api/paris/rest/cicd-api) first released with Orlando, and does not cover other ServiceNow APIs. They will currently work with the Orlando and Paris releases. 

## Usage

1. [Link to Source Control](https://developer.servicenow.com/dev.do#!/learn/learning-plans/paris/new_to_servicenow/app_store_learnv2_devenvironment_paris_linking_an_application_to_source_control) for an application that has been created on your instance. 
2. Add a new file named **.gitlab-ci.yml** in the root directory of the Git repo. This will be your pipeline in GitLab. 
3. Copy and paste the contents of a pipeline template. We provide an example in this repo with the [pipeline template example](example-cicd-pipeline.yml). Change the variables to match your instance URLs, ATF Test Suite sys_id, application scope or sys_id, etc.
4. Configure your CICD Variables in GitLab by defining keys such as **SN_AUTH_DEV** and values in the format **username:password**. Note that [protected variables can only run on protected branches](https://gitlab.com/gitlab-org/gitlab-foss/-/issues/31929#note_276107487), so if you want the variables to be passed into feature branches as it is setup in the example pipeline, you'll have to uncheck the protected variable option. 

![CICD variables](README_images/cicdvariables.png)

5. Depending on how you have your triggers for the pipeline setup, you can now run a build on every commit, push, merge request, etc. The example pipeline will trigger on merge requests and updates to the master branch.

**Other Notes**

Build steps are not independently named, and can be run as `task.sh` throughout your pipeline. To choose which build step to run, specify the `task` variable as a part of the variables section. Please note that the `task` variable must be in lowercase, while all other variables must be in UPPER_CASE. 

**Get Started Video**

[![](https://github.com/ServiceNow/servicenow-cicd-azure-extension/raw/stepbystepinstructions/src/extension/youtube_link.png)](http://www.youtube.com/watch?v=09xZXgVZmME "Get Started with Azure Pipelines in 10 Minutes")

## API docs

Build steps are wrappers for the CI/CD APIs released as a part of Orlando, and will currently work through the Paris release. For more information, please see the ServiceNow [REST API documentation](https://developer.servicenow.com/dev.do#!/reference/api/orlando/rest/cicd-api). Build steps and APIs are not necessarily 1:1 matches; for example, the `TestRun` build step will trigger an ATF Test Suite, get the progress, and when progress reaches 100%, will return the Test Suite result. 

## Build Steps

### Required parameters

Each build step must have the environment variables `SNOWAUTH` and `SNOWINSTANCE` defined. It is recommended that you pass in these values by using the [CICD Variables feature in GitLab](https://docs.gitlab.com/ee/topics/autodevops/customize.html#application-secret-variables). It is important to note that although you will reference the CICD Variable within your pipeline as `K8S_SECRET_VARIABLENAME`, the corresponding key in the CICD Variable must not include `K8S_SECRET_`, and only be `VARIABLENAME`. The expected value for passing in your ServiceNow credentials to the target instance will be in the format of `username:password`. It's recommended to set up a separate service account user that does not have UI Access.

- ServiceNow CI/CD Install Application
> Installs the specified application from the application repository onto the local instance

- ServiceNow CI/CD Publish Application
> Installs the specified application from the application repository onto the local instance

- ServiceNow CI/CD Rollback App
> Initiate a rollback of a specified application to a specified version.

- ServiceNow CI/CD Activate Plugin
> Activate a desired plugin on your ServiceNow instance

- ServiceNow CI/CD Rollback Plugin
> Rollback a desired plugin on your ServiceNow instance

- ServiceNow CI/CD Apply Changes
> Apply changes from a remote source control to a specified local application

- ServiceNow CI/CD Start Test Suite
> Start a specified automated test suite.

## Support Model

ServiceNow built this integration with the intent to help customers get started faster in adopting CI/CD APIs for DevOps workflows, but __will not be providing formal support__. This integration is therefore considered "use at your own risk", and will rely on the open-source community to help drive fixes and feature enhancements via Issues. Occasionally, ServiceNow may choose to contribute to the open-source project to help address the highest priority Issues, and will do our best to keep the integrations updated with the latest API changes shipped with family releases. This is a good opportunity for our customers and community developers to step up and help drive iteration and improvement on these open-source integrations for everyone's benefit. 

## Governance Model

Initially, ServiceNow product management and engineering representatives will own governance of these integrations to ensure consistency with roadmap direction. In the longer term, we hope that contributors from customers and our community developers will help to guide prioritization and maintenance of these integrations. At that point, this governance model can be updated to reflect a broader pool of contributors and maintainers. 





==========


## ServiceNow CI/CD Extension for Azure Pipelines




This extension allows integration of ServiceNow CI/CD functions into Azure Devops pipelines.

Extension itself contains tasks for the pipeline integration. These tasks can be found by its names, all names contain **ServiceNow CI/CD** substring and can be easily filtered through search. Tasks can be added both via classic editor and YAML editor.

Every SNCICD task requires ready and set up ServiceNow connection. Connections setup is available via *Manage* link near *ServiceNow endpoint* field (or via button "+ New")

In order to make kick-off easier we have created the template .yaml file for a common type of usage pipleline - [Example pipeline yaml](example-pipeline.html). It contains all available tasks in different variants of variables usage.

Please, pay attention. Every task's input can be skipped in the setup stage and the values can be passed via ENV variables. Also some tasks produce it's own variables output that can be used both in SNCICD and other tasks. The *AppPublish* task generates variable named `publishVersion` - it contains the version number of recently published app. *AppInstall* task uses this variable if any and produces `rollbackVersion` variable - the previous version of app on production server for rolling back all changes if any of tests goes falsy. And *AppRollback* task consumes this variable.
