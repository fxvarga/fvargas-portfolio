@description('The name of the app that you wish to create.')
param applicationName string

@description('The name of the environment to deploy to.')
param env string

@description('Location for all resources.')
param location string = resourceGroup().location

@description('The name of the sku for the resource that you wish to create.')
param logAnalyticsSKU string = 'pergb2018'

param storageSKU string = 'Standard_RAGRS'

param baseUri string

var primaryResourceGroup = 'rg-${applicationName}-${env}-${primaryLocation}'

@description('Used to determine if the environment is primary or secondary.')
param isPrimaryEnvironment bool = true

@description('Enable or disable app scaling')
param enableAppScaleOut bool = false

@description('The OS to use for the App Service Plan')
param osPlatform string = 'windows'

type osPlatformType = 'windows' | 'linux'
type appServicePlanSkuType = 'P0V3' | 'P1V3' | 'P2V3' | 'P3V3' | 'B2'

param appServicePlan {
  @description('The OS to use for the App Service Plan')
  osPlatform: osPlatformType
  @description('The name of the sku for the resource that you wish to create.')
  sku: appServicePlanSkuType
  @description('The number of workers in the app service plan')
  capacity: int
}
type featureFlag = {
  id: string
  description: string
  enabled: bool
}

@description('Feature flag that displays the outage banner')
param featureFlags featureFlag[] = []

var defaultKeyValue = [
  {
    name: 'AppConfigValues:OutageBannerMessage'
    value: 'Portfolio is currently experiencing an outage.'
  }
]

@description('The client ID for the Azure AD App Registration and valid audiences')
param azureAdSettings object

@description('The location of the primary resoure group if this is a secondary environment.')
param primaryLocation string = resourceGroup().location
var storageAccountUriWithoutTrailingSlash = take(
  createUiStorageAccount.outputs.primaryEndpointsWeb,
  length(createUiStorageAccount.outputs.primaryEndpointsWeb) - 1
)

var storageAccountDomainName = replace(storageAccountUriWithoutTrailingSlash, 'https://', '')
@description('The IP Address CIDRs for the SAW network')
var devsCidr = {
  me:'40.117.66.80/29'
}
var defaultAllowedIpAddresses = [
  {
    value: devsCidr.me
  }
]

var defaultStorageIpRules = [
  for item in defaultAllowedIpAddresses: {
    value: item.value
    action: 'Allow'
  }
]
var ipRestrictions = [
  {
    ipAddress: devsCidr.me
    action: 'Allow'
    priority: 300
    name: 'Me DevBox'
  }
]
var appSettings = [
  {
    name: 'AzureAd__TenantId'
    value: tenant().tenantId
  }
  {
    name: 'AzureAd__ClientId'
    value: azureAdSettings.clientId
  }
  {
    name: 'AzureAd__Authority'
    value: 'https://themaimai.b2clogin.com/themaimai.onmicrosoft.com/B2C_1_general-dev-susi'
  }
  {
    name: 'AzureAd__ClientCredentials__0__SourceType'
    value: 'SignedAssertionFromManagedIdentity'
  }
  {
    name: 'AzureAd__ClientCredentials__0__ManagedIdentityClientId'
    value: createUserManagedIdentity.outputs.userManagedIdentityClientId
  }
  {
    name: 'AzureAd__GraphResource'
    value: 'https://graph.microsoft.com/.default'
  }
  {
    name: 'AppConfig__Endpoint'
    value: createAppConfig.outputs.appConfigEndpoint
  }
  {
    name: 'AzureAd__ManagedIdentityClientId'
    value: createUserManagedIdentity.outputs.userManagedIdentityClientId
  }
  {
    name: 'SiteSettings__GraphQlPaginationMax'
    value: 100
  }
  {
    name: 'SiteSettings__HotChocolateExecutionTimeoutInSeconds'
    value: 240
  }
  {
    name: 'StorageSettings__BlobStorageUrl'
    value: createGeneralStorageAccount.outputs.primaryEndpointBlob
  }
  {
    name: 'UserManagedIdentityClientId'
    value: createUserManagedIdentity.outputs.userManagedIdentityClientId
  }
  {
    name: 'MicrosoftGraph__BaseUrl'
    value: 'https://graph.microsoft.com/v1.0'
  }
  {
    name: 'MicrosoftGraph__Scopes__0'
    value: 'user.read'
  }
  {
    name: 'KernelMemory__Services__AzureOpenAIText__Endpoint'
    value: createAzureOpenAiResource4o.outputs.azureOpenAiUrl
  }
]
param azureOpenAi4o {
  deploymentName: string
  apiVersion: string
  capacity: int
}
param azureOpenAiEmbeddings {
  deploymentName: string
  apiVersion: string
  capacity: int
}
var applicationNameWithEnvironment = '${applicationName}-${env}-${location}'

module createCdnProfile 'modules/cdnProfile.bicep' = {
  name: '${deployment().name}-createCdnProfile'
  params: {
    applicationName: applicationNameWithEnvironment
    staticEndpoint: storageAccountDomainName
    appServiceName: createApiApp.outputs.appServiceName
    logAnalyticsWorkspaceName: createLogAnalyticsWorkspaceForReporting.outputs.name
  }
}
module createLogAnalyticsWorkspaceForReporting 'modules/logAnalyticsWorkspace.bicep' = {
  name: '${deployment().name}-createLogAnalyticsWorkspaceForReporting'
  params: {
    applicationName: applicationNameWithEnvironment
    location: location
    logAnalyticsSku: logAnalyticsSKU
  }

}
module createAppInsights 'modules/appInsights.bicep' = {
  name: '${deployment().name}-appInsights'
  params: {
    applicationName: applicationNameWithEnvironment
    location: location
    workspaceResourceId: createLogAnalyticsWorkspaceForReporting.outputs.logAnalyticsWorkspaceResourceId
    sourceMapStorageUri: createUiStorageAccount.outputs.primaryEndpointsWeb
  }
}

module createAzureOpenAiResource 'modules/azureOpenAiResource.bicep' = {
  name: '${deployment().name}-azureOpenAiResource'
  params: {
    location: location
    aiResourceName: 'oai-${applicationNameWithEnvironment}'
    subdomainName: 'ai-${applicationNameWithEnvironment}'
  }
}

module createAzureOpenAiResource4o 'modules/azureOpenAiModelDeployment.bicep' = {
  name: '${deployment().name}-azureOpenAiResource4o'
  params: {
    aiResourceName: createAzureOpenAiResource.outputs.resourceName
    capacity: azureOpenAi4o.capacity
    modelVersion: azureOpenAi4o.apiVersion
    deploymentName:azureOpenAi4o.deploymentName
    modelName:azureOpenAi4o.deploymentName
  }
}
module createAzureOpenAiResourceEmbedding 'modules/azureOpenAiModelDeployment.bicep' = {
  name: '${deployment().name}-azureOpenAiResourceEmbedding'
  params: {
    aiResourceName: createAzureOpenAiResource.outputs.resourceName
    capacity: azureOpenAiEmbeddings.capacity
    modelVersion: azureOpenAiEmbeddings.apiVersion
    deploymentName: azureOpenAiEmbeddings.deploymentName
    modelName: azureOpenAiEmbeddings.deploymentName
  }
  dependsOn: [
    createAzureOpenAiResource4o
  ]
}
module createAppConfig 'modules/appConfiguration.bicep' = {
  name: '${deployment().name}-createAppConfig'
  params: {
    applicationName: applicationNameWithEnvironment
    location: location
    featureFlags: featureFlags
    keyValues: defaultKeyValue
    vnetName: createVnet.outputs.vnetName
    logAnalyticsWorkspaceName: createLogAnalyticsWorkspaceForReporting.outputs.name
  }
}
module createGeneralStorageAccount 'modules/storageAccount.bicep' = {
  name: '${deployment().name}-createGeneralStorageAccount'
  params: {
    storageAccountName: applicationNameWithEnvironment
    storageSKU: 'Standard_RAGRS'
    location: location
    networkAcls: {
      defaultAction: 'Deny'
      ipRules: defaultStorageIpRules
    }
    privateEndpointResourceName: 'stgeneral'
    vnetName: createVnet.outputs.vnetName
    applicationName: applicationNameWithEnvironment
    createBlobStorageEndpoint: false
  }
}
module createUserManagedIdentity 'modules/userAssignedIdentity.bicep' = {
  name: '${deployment().name}-userManagedIdentity'
  params: {
    applicationName: applicationNameWithEnvironment
    location: location
  }
}

module createHostingPlan 'modules/appServicePlan.bicep' = {
  name: '${deployment().name}-createHostingPlan'
  params: {
    applicationName: applicationNameWithEnvironment
    location: location
    osPlatform: appServicePlan.osPlatform
    appServicePlanSKU: appServicePlan.sku
    appServicePlanCapacity: appServicePlan.capacity
  }
}
module createDefaultSecurityGroup 'modules/networkSecurityGroup.bicep' = {
  name: '${deployment().name}-createDefaultSecurityGroup'
  params: {
    location: location
    applicationName: applicationNameWithEnvironment
    subNetName: 'default'
  }
}
module createApiSecurityGroup 'modules/networkSecurityGroup.bicep' = {
  name: '${deployment().name}-createApiSecurityGroup'
  params: {
    location: location
    applicationName: applicationNameWithEnvironment
    subNetName: 'api'
  }
}
module createVnet 'modules/virtualNetwork.bicep' = {
  name: '${deployment().name}-createVnet'
  params: {
    applicationName: applicationNameWithEnvironment
    apiNetworkSecurityGroupResourceId: createApiSecurityGroup.outputs.networkSecurityGroupId
    defaultNetworkSecurityGroupResourceId: createDefaultSecurityGroup.outputs.networkSecurityGroupId
    location: location
    apiServerFarmName: createHostingPlan.outputs.appServicePlanName
  }
}

module createUiStorageAccount 'modules/storageAccount.bicep' = {
  name: '${deployment().name}-uiStorageAccount'
  params: {
    storageAccountName: 'ui${applicationNameWithEnvironment}'
    storageSKU: storageSKU
    location: location
    networkAcls: {
      defaultAction: 'Deny'
      ipRules: defaultStorageIpRules
    }
    privateEndpointResourceName: 'ui'
    vnetName: createVnet.outputs.vnetName
    applicationName: applicationNameWithEnvironment
  }
}

module createApiApp 'modules/appService.bicep' = {
  name: '${deployment().name}-createApiApp'
  params: {
    applicationName: applicationNameWithEnvironment
    location: location
    serverFarmId: createHostingPlan.outputs.appServicePlanResourceId
    startupCommand: 'dotnet FvPortfolio.Api.dll'
    healthCheckEndpoint: '/healthcheck'
    enableAppScaling: enableAppScaleOut
    userManagedIdentityName: createUserManagedIdentity.outputs.userManagedIdentityName
    osPlatform: osPlatform
    appInsightsName: createAppInsights.outputs.appInsightsName
    logAnalyticsWorkspaceName: createLogAnalyticsWorkspaceForReporting.outputs.name
    enablePrivateEndpoint: false
    vnetName: createVnet.outputs.vnetName
    privateEndpointSubnetId: createVnet.outputs.apiSubnetId
    primaryResourceGroup: isPrimaryEnvironment ? resourceGroup().name : primaryResourceGroup
    appSettings: appSettings
    ipRestrictions: ipRestrictions
    webSocketsEnabled:true
    corsAllowedOrigins: [
      baseUri
    ]
  }
}
// Front door CORS deployed on 'existing' resource to avoid circular reference webapp <=> front door.
resource existingAppService 'Microsoft.Web/sites@2024-04-01' existing = {
  name: 'app-${applicationNameWithEnvironment}'
  resource existingAppServiceConfig 'config@2024-04-01' = {
    name: 'web'
    properties: {
      cors: {
        allowedOrigins: [
          'https://${createCdnProfile.outputs.cdnHostName}'
        ]
        supportCredentials: true
      }
    }
    dependsOn: [
      createApiApp
    ]
  }

}
