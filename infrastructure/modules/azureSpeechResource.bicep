param speechResourceName string
param subdomainName string
param skuSize string = 'S0'

@description('Location for all resources.')
param location string = resourceGroup().location

resource azureSpeechResource 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: speechResourceName
  location: location
  sku: {
    name: skuSize
  }
  kind: 'SpeechServices'
  properties: {
    customSubDomainName: subdomainName
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
  }
}

output endpoint string = azureSpeechResource.properties.endpoint
output region string = azureSpeechResource.location
output primaryKey string = listKeys(azureSpeechResource.id, azureSpeechResource.apiVersion).key1
