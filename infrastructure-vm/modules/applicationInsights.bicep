@description('Location for the resource.')
param location string

@description('Application name used for naming.')
param applicationName string

@description('Log Analytics workspace resource ID.')
param workspaceId string

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-tinytoes-${applicationName}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspaceId
    DisableIpMasking: false
  }
}

output appInsightsId string = appInsights.id
output appInsightsName string = appInsights.name
output connectionString string = appInsights.properties.ConnectionString
output instrumentationKey string = appInsights.properties.InstrumentationKey
