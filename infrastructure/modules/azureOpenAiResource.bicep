param aiResourceName string
param subdomainName string
param skuSize string = 'S0'

@description('Location for all resources.')
param location string = resourceGroup().location

resource azureOpenAiResource 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: aiResourceName
  location: location
  sku: {
    name: skuSize
  }
  kind: 'OpenAI'
  properties: {
    customSubDomainName: subdomainName
    networkAcls: {
      defaultAction: 'Allow'
      virtualNetworkRules: []
      ipRules: []
    }
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: true

  }
}

output azureOpenAiUrl string = azureOpenAiResource.properties.endpoint
output resourceName string = azureOpenAiResource.name
