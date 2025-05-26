@description('The name of the function app being created')
param applicationName string

@description('Specifies the Azure region to create the resource')
param location string

@description('Specifies the ResourceId of the default network security group')
param defaultNetworkSecurityGroupResourceId string

@description('Specifies the ResourceId of the api netwok security group')
param apiNetworkSecurityGroupResourceId string

@description('Specifies the api app server farm name')
param apiServerFarmName string

var vnetName = 'vnet-${applicationName}'

var serviceEndpoints = [
  {
    locations: [
      'location'
    ]
    service: 'Microsoft.Storage'
  }
  {
    locations: [
      'location'
    ]
    service: 'Microsoft.Sql'
  }
  {
    locations: [
      'location'
    ]
    service: 'Microsoft.KeyVault'
  }
  {
    locations: [
      'location'
    ]
    service: 'Microsoft.ServiceBus'
  }
]

resource apiServerFarm 'Microsoft.Web/serverfarms@2023-01-01' existing = {
  name: apiServerFarmName
}

resource virtualNetworks 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '192.168.0.0/20'
      ]
    }
    subnets: [
      {
        name: 'default'
        properties: {
          addressPrefix: '192.168.0.0/24'
          privateEndpointNetworkPolicies: 'Disabled'
          serviceEndpoints: serviceEndpoints
          networkSecurityGroup: {
            id: defaultNetworkSecurityGroupResourceId
          }
        }
      }
      {
        name: 'api'
        properties: {
          addressPrefix: '192.168.2.0/24'
          serviceEndpoints: serviceEndpoints
          delegations: [
            {
              name: 'api'
              id: apiServerFarm.id
              type: 'Microsoft.Web/serverfarms'
              properties: {
                serviceName: 'Microsoft.Web/serverfarms'
              }
            }
          ]
          networkSecurityGroup: {
            id: apiNetworkSecurityGroupResourceId
          }
        }
      }
    ]
  }
}

output vnetId string = virtualNetworks.id
output vnetName string = virtualNetworks.name
output defaultSubnetId string = virtualNetworks.properties.subnets[0].id
output apiSubnetId string = virtualNetworks.properties.subnets[1].id
