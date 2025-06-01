# nodejs-pipelines-gitops

1) Instalar o operador do Pipelines


oc policy add-role-to-user system:image-pusher system:serviceaccount:app:pipeline


2) Instalar o operador do GitOps