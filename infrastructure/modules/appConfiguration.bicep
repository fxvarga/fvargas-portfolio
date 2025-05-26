@description('The name of the app that you wish to create.')
param applicationName string

@description('Specifies the Azure location where the app configuration store should be created.')
param location string = resourceGroup().location

param featureFlags array = []

param keyValues array = []

@description('Name of the vnet resource to deploy private endpoints')
param vnetName string

@description('Specify a log analytics account to send the blobs audit logs to')
param logAnalyticsWorkspaceName string

var configStoreName = 'appcstr-${applicationName}'

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2021-06-01' existing = {
  name: logAnalyticsWorkspaceName
}

resource configurationStores 'Microsoft.AppConfiguration/configurationStores@2023-08-01-preview' = {
  name: configStoreName
  location: location
  sku: {
    name: 'standard'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    disableLocalAuth: false
    enablePurgeProtection: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled' // This is enabled to allow option "Enabled from select virtual networks and IP addresses"
    // dataPlaneProxy: {
    //   authenticationMode: 'Pass-through'
    //   privateLinkDelegation: 'Enabled'
    // }
  }
}

module addAppConfigValues './addAppConfigKeyValue.bicep' = {
  name: '${deployment().name}-configValues'
  params: {
    configStoreName: configurationStores.name
    keyValues: keyValues
    featureFlags: featureFlags
  }
}

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: configurationStores
  name: 'audit-${configurationStores.name}'
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'Audit'
        enabled: true
      }
    ]
  }
}

// var subResource = 'configurationStores'

// resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' existing = {
//   name: vnetName
// }

// module createPrivateEndpointAppConfig './privateEndpoint.bicep' = {
//   name: '${deployment().name}-privateEndpoint'
//   params: {
//     appName: applicationName
//     location: location
//     serviceId: configurationStores.id
//     resourceTypeName: subResource
//     subnetId: vnet.properties.subnets[0].id
//     subResource: subResource
//   }
// }

// module createPrivateDnsAppConfig './privateDnsZone.bicep' = {
//   name: '${deployment().name}-privateDnsAppConfig'
//   params: {
//     privateEndpointName: createPrivateEndpointAppConfig.outputs.privateEndpointName
//     vnetName: vnet.name
//     hostname: 'privatelink.azconfig.io'
//     subResource: subResource
//   }
// }

output appConfigName string = configurationStores.name
output appConfigEndpoint string = configurationStores.properties.endpoint
