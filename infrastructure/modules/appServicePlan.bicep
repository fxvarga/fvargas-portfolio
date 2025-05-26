@description('The name of the app that you wish to create.')
param applicationName string

@description('The name of the sku for the resource that you wish to create.')
@allowed([
  'D1'
  'F1'
  'B1'
  'B2'
  'B3'
  'S1'
  'S2'
  'S3'
  'P1'
  'P2'
  'P3'
  'P1V2'
  'P2V2'
  'P3V2'
  'P0V3'
  'P1V3'
  'P2V3'
  'P3V3'
  'I1'
  'I2'
  'I3'
  'Y1'
  'EP1'
  'EP2'
  'EP3'
])
param appServicePlanSKU string

@description('The number of workers in the app service plan')
param appServicePlanCapacity int

@description('Location for all resources.')
param location string = resourceGroup().location

@allowed([
  'windows'
  'linux'
])
param osPlatform string

var appServicePlanName = 'plan-${applicationName}'

resource serverFarm 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: appServicePlanSKU
    capacity: appServicePlanCapacity
  }
  kind: 'app'
  properties: {
    perSiteScaling: false
    maximumElasticWorkerCount: 1
    reserved: osPlatform == 'windows' ? false : true
    targetWorkerCount: 0
    targetWorkerSizeId: 0
  }
}

output appServicePlanResourceId string = serverFarm.id
output appServicePlanName string = serverFarm.name
