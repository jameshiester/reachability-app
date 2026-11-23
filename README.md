# Reachability app

Use Node.js 24.

```sh
npm ci
npm run build
npm start
```

To build the image and run it locally with HTTP forwarded to port 8080:

```sh
docker build -t reachability-app .
docker run --rm -p 127.0.0.1:8080:8080 reachability-app
curl http://127.0.0.1:8080/healthz
```

## Publish to ECR

Set these GitHub Actions repository variables.

| Variable | Value |
| --- | --- |
| `AWS_REGION` | Region of the private ECR repository |
| `AWS_ROLE_ARN` | IAM role in the account that owns the ECR repository |
| `ECR_REPOSITORY` | Name of the existing ECR repository |

Configure the IAM role to trust GitHub's OIDC provider and restrict its trust to the GitHub repository and publishing branch. Grant the role `ecr:GetAuthorizationToken` and repository-scoped permissions for checking layers, uploading layers, and putting images.

Run **Publish to ECR** from GitHub Actions on the trusted branch. The workflow publishes a commit-SHA tag and reports the image URI in the run summary.
