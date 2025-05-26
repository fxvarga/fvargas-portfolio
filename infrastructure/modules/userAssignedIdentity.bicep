@description('The name of the app that you wish to create.')
param applicationName string

@description('Specifies the Azure location where the key vault should be created.')
param location string = resourceGroup().location

resource userManagedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${applicationName}'
  location: location
}

output userManagedIdentityId string = userManagedIdentity.id
output userManagedIdentityName string = userManagedIdentity.name
output userManagedIdentityObjectId string = userManagedIdentity.properties.principalId
output userManagedIdentityClientId string = userManagedIdentity.properties.clientId
