# gomashio

inspired by https://github.com/kawahara/github2slack-lambda

## Feature
* convert GitHub mention to Slack mention
    * reviewers
    * assignees
    * issue / pr comment

## Format

| key | value | default | required |
| --- | --- | --- | --- |
| account\_map | A object with key of github account  and value of slack account | - | o |
| repository\_map | A object with key of github repository and value of slack channel| - | o |
| ignore\_event\_map | A object with key of github event and value of array of action for github event| - |

sample

```json
{
  "account_map": {
    "kotatsu360": "tmitsuno"
  },
  "repository\_map": {
    "^gomashio": "#gomashio-dev",
    ".*": "#general"
  },
  "ignore_event_map": {
    "issue_comment": [
      "edited"
    ]
  }
}
```

## Architecture
```
GitHub -> Amazon API Gateway -> AWS Lambda -> Slack
```

## Basic Usage
### initialize api gateway / lambda function
1. create Slack App
    * https://api.slack.com/apps?new_app=1
    * ![newapp](https://user-images.githubusercontent.com/10104981/38778613-2db863e4-40f7-11e8-9219-da52eb43ec91.png)
1. set Scope
    * `chat:write:bot`, `users:read`
    * ![select_permissions](https://user-images.githubusercontent.com/10104981/38778612-2d9513ee-40f7-11e8-98c1-a3d5b4be5c68.png)
    * ![scopes](https://user-images.githubusercontent.com/10104981/38778615-2e02de4c-40f7-11e8-9d64-d192e448fd9e.png)
1. install Slack App to your Slack Team
    * copy OAuth Access Token
    * ![install](https://user-images.githubusercontent.com/10104981/38778614-2ddc9624-40f7-11e8-8dda-2cba62f59302.png)
    * ![copy](https://user-images.githubusercontent.com/10104981/38778616-2e26aa84-40f7-11e8-938f-3e70890fafdb.png)
1. set OAuth Access Token to SSM SecureString
    * https://console.aws.amazon.com/systems-manager/parameters/
    * ![image](https://user-images.githubusercontent.com/10104981/38820959-35db06b0-41da-11e8-9c9b-0bc9fe9c1ba7.png)
1. <a href="https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=gomashio&templateURL=https://raw.githubusercontent.com/kotatsu360/gomashio/master/cfn/gomashio.yml">launch gomashio</a>
    * set SSM Parameter Name to `EncryptedTokenName`
1. Note `ApiGatewayRestApi` what is CFn Resource Name.
    * ![image](https://user-images.githubusercontent.com/10104981/35285111-de96af1a-009f-11e8-95a9-1f065f89b9a3.png)
1. set Endpoint URL to your GitHub Repository
    * `https://<RestApi ID>.execute-api.<Region>.amazonaws.com/production/`

### update lambda function
1. edit `<gomashio root>/config/config.json`
1. `zip -r index.zip <gomashio root>/`
2. upload lambda

## Advanced Usage (gomashio with CI)
1. Basic Usage > initialize api gateway / lambda function
2. <a href="https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=gomashio&templateURL=https://raw.githubusercontent.com/kotatsu360/gomashio/master/cfn/ci.yml">launch gomachio-ci</a>
    * set FunctionStackName ( default: gomashio )
3. Note `S3BucketCodePipelineSource` what is CFn Resource Name.
4. create `IAMUserCI` Access Token
4. set Access Token to CI
4. set `AWS_DEFAULT_REGION` to CI
5. set `S3_BUCKET_CODE_PIPELINE_SOURCE` to CI

### update lambda function
1. edit `<gomashio root>/config/config.json`
1. merge or push master branch

## Remove gomashio
1. remove gomashio-ci-stack from CFn
1. remove gomashio-stack from CFn
1. remove gomashio-ci-role from IAM
   * `<gomashio-ci-stack name>-IAMRoleCloudFormation-<Random string>`

# LICENSE
This software is released under the MIT License, see LICENSE

