@description('The name of the app being created')
param appName string

@description('The name of the resouce type private Endpoint is being created for')
param resourceTypeName string

@description('Specifies the Azure Location where the private Endpoint is created')
param location string

@description('Specifies the SubnetId being used for the private Endpoint')
param subnetId string

@description('Specifies the serviceId being used for the private Endpoint')
param serviceId string

@description('sub resource name')
param subResource string

var privateEndpointName = 'pe-${appName}-${resourceTypeName}'

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: privateEndpointName
  location: location
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: privateEndpointName
        properties: {
          privateLinkServiceId: serviceId
          groupIds: [
            subResource
          ]
        }
      }
    ]
  }
}

output privateEndpointName string = privateEndpoint.name
