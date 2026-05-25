@description('Location for the resource.')
param location string

@description('Application name used for naming.')
param applicationName string

@description('SKU for Log Analytics.')
param sku string = 'PerGB2018'

resource law 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'law-${applicationName}'
  location: location
  properties: {
    sku: {
      name: sku
    }
    retentionInDays: 30
  }
}

output workspaceId string = law.id
output workspaceName string = law.name
output customerId string = law.properties.customerId
