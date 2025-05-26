@description('Specify the storage account name.')
param storageAccountName string

@description('The name of the app that you wish to create.')
param applicationName string = ''

@description('Specify a location for the resources.')
param location string

// not using for now
@description('If using private endpoints these acls should be provided to only allow traffic from the vnet')
param networkAcls object

@description('Specify the storage account type.')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_ZRS'
  'Premium_LRS'
  'Premium_ZRS'
  'Standard_GZRS'
  'Standard_RAGZRS'
])
param storageSKU string = 'Standard_LRS'

param kind string = 'StorageV2'

@description('Name of the vnet resource to deploy private endpoints')
param vnetName string

@description('Name of the resource that the private Endpoint would be used for')
param privateEndpointResourceName string = ''

@description('Specify if you want to create a blob storage endpoint.')
param createBlobStorageEndpoint bool = false


resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: substring(replace(toLower('st${storageAccountName}'), '-', ''), 0, 24)
  location: location
  sku: {
    name: storageSKU
  }
  kind: kind
  properties: {
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: true
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled' // This is enabled to allow option "Enabled from select virtual networks and IP addresses"
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' existing = {
  name: vnetName
}

module createPrivateEndpointBlobStorage './privateEndpoint.bicep' = if (createBlobStorageEndpoint) {
  name: '${deployment().name}-privateEndpointblob'
  params: {
    appName: applicationName
    location: location
    serviceId: storageAccount.id
    resourceTypeName: '${privateEndpointResourceName}blob'
    subnetId: vnet.properties.subnets[0].id
    subResource: 'blob'
  }
}

module createPrivateDnsStorageBlob './privateDnsZone.bicep' = if (createBlobStorageEndpoint) {
  name: '${deployment().name}-privateDnsStorageBlob'
  params: {
    privateEndpointName: createBlobStorageEndpoint ? createPrivateEndpointBlobStorage.?outputs.privateEndpointName : ''
    vnetName: vnet.name
    hostname: 'privatelink.blob.${environment().suffixes.storage}'
    subResource: 'blob'
  }
}


output storageAccountId string = storageAccount.id
output storageAccountName string = storageAccount.name
output primaryEndpointBlob string = storageAccount.properties.primaryEndpoints.blob
output primaryEndpointsWeb string = storageAccount.properties.primaryEndpoints.web
