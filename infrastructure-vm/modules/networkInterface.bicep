@description('Location for the resource.')
param location string

@description('Application name used for naming.')
param applicationName string

@description('Subnet resource ID.')
param subnetId string

@description('Public IP resource ID.')
param publicIpId string

resource nic 'Microsoft.Network/networkInterfaces@2024-01-01' = {
  name: 'nic-${applicationName}'
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          subnet: {
            id: subnetId
          }
          publicIPAddress: {
            id: publicIpId
          }
        }
      }
    ]
  }
}

output nicId string = nic.id
output privateIpAddress string = nic.properties.ipConfigurations[0].properties.privateIPAddress
