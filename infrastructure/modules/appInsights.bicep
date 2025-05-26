@description('The name of the app that you wish to create.')
param applicationName string

@description('Workspace Id to migrate app insights to.')
param workspaceResourceId string

@description('Location for all resources.')
param location string = resourceGroup().location

@description('Javascript source map blob storage URL')
param sourceMapStorageUri string

var appInsightsName = 'appi-${applicationName}'

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  tags: {
    'hidden-link:Insights.Sourcemap.Storage': '{"Uri":"${sourceMapStorageUri}"}'
  }
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspaceResourceId
  }
}

output appInsightsResourceId string = applicationInsights.id
output appInsightsName string = applicationInsights.name
output appInsightsConnectionString string = applicationInsights.properties.ConnectionString
