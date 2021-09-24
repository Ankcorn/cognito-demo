import * as sst from "@serverless-stack/resources";
import { HttpJwtAuthorizer } from "@aws-cdk/aws-apigatewayv2-authorizers";

export default class MyStack extends sst.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const auth = new sst.Auth(this, 'Auth', {
      cognito: true,
    })

    const staticSite = new sst.StaticSite(this, 'StaticSite', {
      path: "frontend",
      buildOutput: "dist",
      buildCommand: "npm run build",
      environment: {
        VITE_USER_POOL_ID: auth.cognitoUserPool.userPoolId
      }
    });

    // Create a HTTP API
    const api = new sst.Api(this, "Api", {
      defaultAuthorizationType: ApiAuthorizationType.JWT,
      defaultAuthorizer: new HttpJwtAuthorizer({
        jwtAudience: [auth.cognitoUserPoolClient.userPoolClientId],
        jwtIssuer: `https://cognito-idp.eu-west-1.amazonaws.com/${auth.cognitoUserPool.UserPoolId}`,
      }),
      routes: {
        "GET /": "src/lambda.handler",
      },
    });

    // Show the endpoint in the output
    this.addOutputs({
      "ApiEndpoint": api.url,
      'UserPoolId': auth.cognitoUserPool.userPoolId,
      "StaticSiteUrl": staticSite.distributionDomain,
    });
  }
}
