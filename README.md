# Red Hat OpenShift Pipelines and GitOps Lab

### <h2 style="color: #e5b449;">What is</h2>

**Red Hat OpenShift Pipelines** is a Tekton-based solution that enables the creation and execution of continuous integration and delivery (CI/CD) workflows natively on OpenShift, using containers for each step of the pipeline. It offers a declarative, scalable, and isolated approach to automating builds, tests, and deployments, without the need for dedicated servers as in traditional systems, promoting greater security, reproducibility, and integration with the Kubernetes ecosystem.
<br>

**Red Hat OpenShift GitOps** is a solution based on Argo CD that enables the management of configuration and the desired state of OpenShift applications and clusters from Git repositories. It adopts the GitOps model, where Git serves as the single source of truth, ensuring that any changes to versioned manifests are automatically synchronized with the runtime environment. This provides greater control, auditability, consistency, and automation in the continuous delivery process, while also facilitating rollback and observability of changes in the environment.
<br>

### <h2 style="color: #e5b449;">Versions used in this tutorial</h2>

| Component                                   | Version |
|---------------------------------------------|---------|
| Red Hat OpenShift Container Platform        | 4.17    |
| Red Hat OpenShift Pipelines                 | 1.18    |
| Red Hat OpenShift GitOps                    | 1.16    |

### <h2 style="color: #e5b449;">How-to install and configure Red Hat OpenShift Pipelines</h2>

First, let's create a project named app.

![Creating app project](./images/pipelines/01%20-%20Creating%20the%20app%20project.png)

Next, we need to install the operator. To do this, go to the left-hand side menu and access *Operators > Operator Hub*. In the search field, look for Pipelines and select the option **Red Hat OpenShift Pipelines**. Finally, click the *Install button*.

![Installing pipelines operator](./images/pipelines/02%20-%20Installing%20Pipelines%20Operator.png)

A form will then be displayed with options to configure the operator installation. Keep all the default options and click the *Install button*.

![Installing pipelines operator](./images/pipelines/03%20-%20Installing%20Pipelines%20Operator.png)

After installing the operator, the Pipelines option will appear in the left-hand menu of the OpenShift console, with the submenus Overview, Pipelines, Tasks, and Triggers.

![Installing pipelines operator](./images/pipelines/04%20-%20Installing%20Pipelines%20Operator.png)

At this point, we will need to log in to OpenShift using the oc CLI.

```
$ oc login -u <user> -p <password> <host>
```
If you're not in the app project, switch to it, as the resources needed to create the pipeline must be applied there.

```
$ oc project app
```
Now I invite you to review the YAML files prepared for the pipeline creation. They are located in the [infra/tekton/](./infra/tekton/) directory of this repository. There are 7 files distributed among CRs of the types Pipeline, PipelineRun, and Task.

> **Pipelines** are sequences of steps that are automatically executed to build, test, and deploy applications. They are made up of tasks.

> **PipelineRuns** are Kubernetes resources that represent the execution of a specific pipeline. They are created to instantiate a pipeline and start its execution.

> **Tasks** are the individual steps that make up a pipeline, such as running a test, building a Docker image, or executing a script.

Let's apply the YAML files inside the **/infra/tekton directory** in the exact sequence to correctly build the pipeline.

```
$ oc apply -f pipeline.yaml -n app
```
After applying the pipeline YAML, you can see in the OpenShift console that the resource has been created.

![Installing pipelines operator](./images/pipelines/05-%20Creating%20pipeline.png)

```
$ oc apply -f task-git-clone.yaml -n app
```
```
$ oc apply -f task-tests.yaml -n app
```
```
$ oc apply -f task-kaniko-build.yaml -n app
```
```
$ oc apply -f task-push-image.yaml -n app
```

We will need to obtain the GitHub user access token for authentication during pipeline execution. The update manifests task will perform a commit to the repository with the resources for deploying the application.

First, click the Settings option under the user account avatar. 

![Installing pipelines operator](./images/pipelines/06%20-%20Github%20user%20options%20menu.png)

On the settings page, click the Developer Settings option.

![Installing pipelines operator](./images/pipelines/07%20-%20Choice%20Developer%20settings.png)


Now click on Personal access tokens > Tokens (classic) and create a token with the desired duration and all repo permissions. At the end, a token will be displayed on the screen. Save this token, as it will only be shown at this moment. If you lose it, you will need to generate a new one.

![Installing pipelines operator](./images/pipelines/08%20-%20Getting%20coderepo%20access%20token.png)


Let's create a secret to store this token.

```
$ oc create secret generic github-token --from-literal=token=<SEU_TOKEN_GITHUB> -n app

```

Once the secret is applied, we can apply the task-update-manifests.yaml Task.

```
$ oc apply -f task-update-manifests.yaml -n app
```

After applying all the tasks, let's check in the OpenShift console that they have all been created.

![Installing pipelines operator](./images/pipelines/06-%20Creating%20tasks.png)

Let's grant the "pipeline" service account in the "app" namespace the "image-pusher" permission, that is, authorize this service account to push images to the OpenShift internal image registry.

```
$ oc policy add-role-to-user system:image-pusher system:serviceaccount:app:pipeline
```

Finally, apply the pipeline run YAML so that the pipeline is instantiated and execution begins.

```
$ oc apply -f pipeline-run.yaml -n app
```

![Installing pipelines operator](./images/pipelines/07-%20Creating%20pipelinerun.png)

All the steps will be marked in green, indicating that the pipeline has been successfully executed.

![Installing pipelines operator](./images/pipelines/08-%20Pipelinerun%20succeeded.png)

### <h2 style="color: #e5b449;">How-to verify if the generated images were pushed to the container registry</h2>

For the context of our lab, the images were pushed to OpenShift's internal image registry. To access it, we first need to log in, but this requires a few steps.

1. We need to create a service account to access the registry and assign it builder and pusher permissions.

```
$ oc create serviceaccount pipeline-sa -n app
```

```
$ oc policy add-role-to-user system:image-builder -z pipeline-sa -n app
```

```
$ oc policy add-role-to-user system:image-pusher -z pipeline-sa -n app
```
2. Now let's retrieve the internal registry address and the service account token. Finally, we'll store them in terminal variables.

```
$ REGISTRY=$(oc get route default-route -n openshift-image-registry --template='{{ .spec.host }}')
```

```
$ TOKEN=$(oc create token pipeline-sa -n app)
```

3. Let's log in to the internal registry. If successful, you should see the response: Login Succeeded!

```
$ podman login -u pipeline-sa -p $TOKEN $REGISTRY
```
4. Using the skopeo CLI, let's list the tags created in the OpenShift internal registry for our image. 

```
$ skopeo list-tags --tls-verify=false docker://$REGISTRY/app/nodejs-lab-app
```

5.The result of this command should look something like this:

*{
    "Repository": "default-route-openshift-image-registry.apps.cluster-9jk4z.9jk4z.sandbox1696.opentlc.com/app/nodejs-lab-app",
    "Tags": [
        "v1.0"
    ]
}*

### <h2 style="color: #e5b449;">How-to install and configure Red Hat OpenShift GitOps</h2>

We need to install the operator. To do this, go to the left-hand side menu and access *Operators > Operator Hub*. In the search field, look for Pipelines and select the option **Red Hat OpenShift GitOps**. Finally, click the *Install button*.

![Installing pipelines operator](./images/gitops/01%20-%20Installing%20GitOps%20Operator.png)

A form will then be displayed with options to configure the operator installation. Keep all the default options and click the *Install button*.

![Installing pipelines operator](./images/gitops/02%20-%20Installing%20GitOps%20Operator.png)

Wait until the installation is successfully completed. Once finished, access the main panel of the Red Hat OpenShift GitOps operator.

![Installing pipelines operator](./images/gitops/03%20-%20Installing%20GitOps%20Operator.png)

Access the ArgoCD tab and see that the openshift-gitops resource was created automatically. This is the ArgoCD instance we will use.

![Installing pipelines operator](./images/gitops/04%20-%20ArgoCD%20resource%20created.png)

You can see that a route has been defined to access the ArgoCD portal through the browser.

![Installing pipelines operator](./images/gitops/05%20-%20ArgoCD%20route%20available.png)

Click the link that provides access to the route, and the ArgoCD login page will open. You should click the "Log in via OpenShift" button. Authenticate using your OpenShift credentials. 

![Installing pipelines operator](./images/gitops/06%20-%20ArgoCD%20login%20page.png)

![Installing pipelines operator](./images/gitops/07%20-%20ArgoCD%20login%20with%20openshift.png)

If everything is correct and the login is successful, you will be redirected to the ArgoCD main dashboard.

![Installing pipelines operator](./images/gitops/08%20-%20ArgoCD%20main%20dashboard.png)



oc patch argocd openshift-gitops -n openshift-gitops --type=merge -p '{"spec":{"controller":{"env":[{"name":"ARGOCD_RECONCILIATION_TIMEOUT","value":"30s"}]}}}'
