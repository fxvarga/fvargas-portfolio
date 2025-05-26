@description('The name of the private endpoint')
param privateEndpointName string

@description('hostname of the resource for the private link')
param hostname string

@description('Name of the virtual Network')
param vnetName string

@description('sub resource name')
param subResource string

@description('Only override if the virtual network is in a different resource group')
param vnetResourceGroup string = resourceGroup().name

@description('Suffix to append to the external resource name if vnet is in a different resource group')
param externalResourceSuffix string = ''

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-09-01' existing = {
  scope: resourceGroup(vnetResourceGroup)
  name: vnetName
}

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' existing = {
  name: privateEndpointName
}

resource existingPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' existing = {
  scope: resourceGroup(vnetResourceGroup)
  name: hostname
}

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = if (empty(externalResourceSuffix)) {
  name: hostname
  location: 'global'
}

resource privateDnsZoneGroups 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-09-01' = {
  parent: privateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config-${subResource}${externalResourceSuffix}'
        properties: {
          privateDnsZoneId: empty(externalResourceSuffix) ? privateDnsZone.id : existingPrivateDnsZone.id
        }
      }
    ]
  }
}

resource virtualNetworkLinks 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = if (empty(externalResourceSuffix)) {
  parent: privateDnsZone
  name: 'pdnsz-${hostname}'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: virtualNetwork.id
    }
  }
}

output privateDnsZoneId string = privateDnsZone.id
output privateDnsZoneName string = privateDnsZone.name
