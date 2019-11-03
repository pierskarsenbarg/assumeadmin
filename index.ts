import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const current = aws.getCallerIdentity();
const rootArn = `arn:aws:iam::${current.accountId}:root`;

const role = new aws.iam.Role("assume_admin_role-pulumi",{
    maxSessionDuration: 28800,
    assumeRolePolicy: {
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Principal: { "AWS": rootArn },
            Effect: "Allow",
            Sid: "",
        }]
    }
});

const policy = new aws.iam.Policy("assume_admin_policy-pulumi",
    {
        policy: role.arn.apply(arn => JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "",
                        Effect: "Allow",
                        Action: "sts:AssumeRole",
                        Resource: `${arn}`,
                        Condition: {
                            BoolIfExists: {
                                "aws:MultiFactorAuthPresent": "true"
                            }
                        }
                    }
                ]
            }
        ))
    }, {dependsOn: [role]}
);

const rolePolicyAttachment = new aws.iam.RolePolicyAttachment("admin_access_role_policy_attachment",{
    role: role,
    policyArn: aws.iam.ManagedPolicies.AdministratorAccess
});

const group = new aws.iam.Group("AssumeRolePulumi");

const policyAttachment = new aws.iam.PolicyAttachment("admin_policy_attachment", {
    groups: [group],
    policyArn: policy.arn
})

const user = new aws.iam.User("piers-pulumi", {});

const devTeam = new aws.iam.GroupMembership("dev-team", {
    group: group.name,
    users: [ user.name ] 
});
