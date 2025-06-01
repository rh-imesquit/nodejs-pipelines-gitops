# Red Hat OpenShift Pipelines and GitOps Lab

### <h2 style="color: #e5b449;">What is</h2>

**Red Hat OpenShift Pipelines** is a.
<br>

**Red Hat OpenShift GitOps** is a.
<br>

### <h2 style="color: #e5b449;">Versions used in this tutorial</h2>

| Component                                   | Version |
|---------------------------------------------|---------|
| Red Hat OpenShift Container Platform        | 4.17    |
| Red Hat OpenShift Pipelines                 | 1.18    |
| Red Hat OpenShift GitOps                    | 2.15    |

### <h2 style="color: #e5b449;">How-to install and configure Red Hat OpenShift Pipelines</h2>

First, let's create a project named app.

![Creating app project](../images/3scale/01%20-%20Creating%203scale%20project.png)

![Creating app project](../images/3scale/02%20-%20Creating%203scale%20project.png)

Next, we need to install the operator. To do this, go to the left-hand side menu and access *Operators > Operator Hub*. In the search field, look for Pipelines and select the option **Red Hat OpenShift Pipelines**. Finally, click the *Install button*.

![Installing pipelines operator](./images/pipelines/01%20-%20Installing%20Pipelines%20Operator.png)

A form will then be displayed with options to configure the operator installation. Keep all the default options and click the *Install button*.

![Installing pipelines operator](./images/pipelines/02%20-%20Installing%20Pipelines%20Operator.png)

After installing the operator, the Pipelines option will appear in the left-hand menu of the OpenShift console, with the submenus Overview, Pipelines, Tasks, and Triggers.

![Installing pipelines operator](./images/pipelines/03%20-%20Installing%20Pipelines%20Operator.png)

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

![Installing pipelines operator](./images/pipelines/04%20-%20Creating%20pipeline.png)

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

After applying all the tasks, let's check in the OpenShift console that they have all been created.

![Installing pipelines operator](./images/pipelines/05%20-%20Creating%20tasks.png)

Let's grant the "pipeline" service account in the "app" namespace the "image-pusher" permission, that is, authorize this service account to push images to the OpenShift internal image registry.

```
$ oc policy add-role-to-user system:image-pusher system:serviceaccount:app:pipeline
```

Finally, apply the pipeline run YAML so that the pipeline is instantiated and execution begins.

```
$ oc apply -f pipeline-run.yaml -n app
```

![Installing pipelines operator](./images/pipelines/06%20-%20Creating%20pipelinerun.png)

All the steps will be marked in green, indicating that the pipeline has been successfully executed.

![Installing pipelines operator](./images/pipelines/07-%20Pipelinerun%20succeeded.png)

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