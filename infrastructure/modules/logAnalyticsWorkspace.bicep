@description('The name of the app that you wish to create.')
param applicationName string

@description('Specifies the workspace sku.')
param logAnalyticsSku string

@description('Specifies the location in which to create the workspace.')
param location string = resourceGroup().location

var logAnalyticsWorkspaceName = 'log-${applicationName}'

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  tags: {
    appID: 'auto'
    env: 'auto'
    orgID: 'auto'
  }
  properties: {
    sku: {
      name: logAnalyticsSku
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: -1
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

output logAnalyticsWorkspaceResourceId string = logAnalyticsWorkspace.id
output name string = logAnalyticsWorkspace.name
