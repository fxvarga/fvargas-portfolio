@description('The name of the app that you wish to create.')
param applicationName string

@description('Location for all resources.')
param location string = resourceGroup().location

param serverFarmId string

@description('Origins to allow CORS requests from')
param corsAllowedOrigins array = []

@description('Startup Command for the app service')
param startupCommand string

@description('Endpoint for our automated health check')
param healthCheckEndpoint string

@description('true to enable client affinity; false to stop sending session affinity cookies, which route client requests in the same session to the same instance.')
param clientAffinityEnabled bool = false

param appSettings array

@description('Boolean to enable or disable private endpoints')
param enablePrivateEndpoint bool = false

@description('The name of the vnet that the site is attatched to')
param vnetName string = ''

@description('The id of the private endpoint Vnet')
param privateEndpointSubnetId string

@description('If this app should be scaled out')
param enableAppScaling bool = false

param userManagedIdentityName string

param primaryResourceGroup string = resourceGroup().name

@allowed([
  'windows'
  'linux'
])
param osPlatform string

@allowed([
  'DOTNETCORE|8.0'
  'PYTHON|3.11'
])
param linuxFxVersion string = 'DOTNETCORE|8.0'

@description('Name of application insights resource to use')
param appInsightsName string

@description('Specify a log analytics account to send the blobs audit logs to')
param logAnalyticsWorkspaceName string

@description('The IP restrictions for the app service.')
param ipRestrictions array = []

param healthCheckEnabled bool = false

param webSocketsEnabled bool = false

var appServiceName = 'app-${applicationName}'

var appServiceSpecficAppSettings = [
  {
    name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
    value: applicationInsights.properties.ConnectionString
  }
  {
    name: 'WEBSITE_RUN_FROM_PACKAGE'
    value: 1
  }
  {
    name: 'ServiceName'
    value: appServiceName
  }
]

var defaultIpRestrictions = [
  {
    name: 'Deny all'
    action: 'Deny'
    priority: 2147483647
    ipAddress: 'Any'
  }
]

var siteProperties = {
  serverFarmId: serverFarmId
  reserved: osPlatform == 'windows' ? false : true
  clientAffinityEnabled: clientAffinityEnabled
  httpsOnly: true
  virtualNetworkSubnetId: enablePrivateEndpoint ? privateEndpointSubnetId : null
  vnetRouteAllEnabled: enablePrivateEndpoint
  publicNetworkAccess: 'Enabled' // This is enabled to allow option "Enabled from select virtual networks and IP addresses"
  siteConfig: {
    netFrameworkVersion: osPlatform == 'windows' ? 'v8.0' : null
    use32BitWorkerProcess: false
    linuxFxVersion: osPlatform == 'windows' ? null : linuxFxVersion
    appCommandLine: startupCommand
    healthCheckPath: healthCheckEndpoint
    healthCheckEnabled: healthCheckEnabled
    httpLoggingEnabled: true
    detailedErrorLoggingEnabled: true
    requestTracingEnabled: true
    requestTracingExpirationTime: '9999-12-31T23:59:00Z'
    cors: {
      allowedOrigins: corsAllowedOrigins
    }
    appSettings: union(appServiceSpecficAppSettings, appSettings)
    ftpsState: 'FtpsOnly'
    minTlsVersion: '1.2'
    webSocketsEnabled: webSocketsEnabled
    ipSecurityRestrictionsDefaultAction: 'Deny'
    ipSecurityRestrictions: union(defaultIpRestrictions, ipRestrictions)
    scmIpSecurityRestrictionsDefaultAction: 'Deny'
    scmIpSecurityRestrictions: union(defaultIpRestrictions, ipRestrictions)
    scmIpSecurityRestrictionsUseMain: false
  }
}

var identity = {
  type: 'SystemAssigned, UserAssigned'
  userAssignedIdentities: {
    '${userAssignedIdentity.id}': {}
  }
}

var logProperties = {
  httpLogs: {
    fileSystem: {
      retentionInMb: 35
      retentionInDays: 10
      enabled: true
    }
  }
}

resource userAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: userManagedIdentityName
  scope: resourceGroup(primaryResourceGroup)
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: appInsightsName
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsWorkspaceName
}

resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: appServiceName
  location: location
  kind: 'app'
  identity: identity
  properties: siteProperties

  resource publishingProfilesFtp 'basicPublishingCredentialsPolicies@2023-01-01' = {
    name: 'ftp'
    location: location
    properties: {
      allow: false
    }
  }

  resource publishingProfileScm 'basicPublishingCredentialsPolicies@2023-01-01' = {
    name: 'scm'
    location: location
    properties: {
      allow: true
    }
  }

  resource appServiceLogs 'config@2023-01-01' = {
    name: 'logs'
    properties: logProperties
  }
}

// resource appServiceNameSlot 'Microsoft.Web/sites/slots@2023-01-01' = {
//   parent: appService
//   name: 'staging'
//   location: location
//   kind: 'app'
//   identity: identity
//   properties: siteProperties

//   resource publishingProfilesFtp 'basicPublishingCredentialsPolicies@2023-01-01' = {
//     name: 'ftp'
//     location: location
//     properties: {
//       allow: false
//     }
//   }

//   resource publishingProfileScm 'basicPublishingCredentialsPolicies@2023-01-01' = {
//     name: 'scm'
//     location: location
//     properties: {
//       allow: false
//     }
//   }

//   resource appServiceStagingLogs 'config@2023-01-01' = {
//     name: 'logs'
//     properties: logProperties
//   }
// }

resource autoScaleSettings 'Microsoft.Insights/autoscalesettings@2022-10-01' = {
  name: '${applicationName}-autoscale'
  location: location
  properties: {
    name: '${applicationName}-autoscale'
    targetResourceUri: serverFarmId
    enabled: enableAppScaling
    profiles: [
      {
        name: '${applicationName}-autoscale'
        capacity: {
          minimum: '2'
          maximum: '2'
          default: '2'
        }
        rules: []
      }
    ]
  }
}

resource diagnosticsSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'audit-${appServiceName}'
  scope: appService
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
      }
      {
        category: 'AppServiceAuditLogs'
        enabled: true
      }
      {
        category: 'AppServiceIPSecAuditLogs'
        enabled: true
      }
      {
        category: 'AppServicePlatformLogs'
        enabled: true
      }
    ]
  }
}

var subResource = 'sites'

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' existing =
  if (enablePrivateEndpoint) {
    name: vnetName
  }

module createPrivateEndpointAppService './privateEndpoint.bicep' =
  if (enablePrivateEndpoint) {
    name: '${deployment().name}-createPrivateEndpoint'
    params: {
      appName: applicationName
      location: location
      serviceId: appService.id
      resourceTypeName: 'sites'
      subnetId: enablePrivateEndpoint ? vnet.properties.subnets[0].id : ''
      subResource: subResource
    }
  }

module createPrivateDnsAppService './privateDnsZone.bicep' =
  if (enablePrivateEndpoint) {
    name: '${deployment().name}-createPrivateDnsAppService'
    params: {
      privateEndpointName: createPrivateEndpointAppService.outputs.privateEndpointName
      vnetName: vnet.name
      hostname: 'privatelink.azurewebsites.net'
      subResource: subResource
    }
  }

output appServiceName string = appServiceName
output appServiceObjectId string = appService.identity.principalId
// output appServiceSlotObjectId string = appServiceNameSlot.identity.principalId
output appServiceId string = appService.id
output appServiceHostName string = appService.properties.defaultHostName
