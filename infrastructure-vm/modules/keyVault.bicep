@description('Location for the resource.')
param location string

@description('Application name used for naming.')
param applicationName string

@description('VM system-assigned principal ID for access policy.')
param vmPrincipalId string

@description('Tenant ID.')
param tenantId string = tenant().tenantId

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: take('kv-${replace(applicationName, '-', '')}', 24)
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 30
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
  }
}

// Grant VM managed identity Key Vault Secrets User role
resource kvSecretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: kv
  name: guid(kv.id, vmPrincipalId, '4633458b-17de-408a-b874-0445c86b69e6')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: vmPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output keyVaultName string = kv.name
output keyVaultId string = kv.id
output keyVaultUri string = kv.properties.vaultUri
