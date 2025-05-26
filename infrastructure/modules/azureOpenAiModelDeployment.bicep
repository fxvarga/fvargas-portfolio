param capacity int = 75
param deploymentName string = 'gpt4o'
param modelName string = 'gpt-4o'
param modelVersion string = '2024-05-13'
param aiResourceName string

resource azureOpenAiResource 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' existing = {
  name: aiResourceName
}
resource azureOpenAiResource_model 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
  parent: azureOpenAiResource
  name:deploymentName
  sku: {
    name: 'Standard'
    capacity: capacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: modelName
      version: modelVersion
    }
    versionUpgradeOption: 'OnceCurrentVersionExpired'
    currentCapacity: capacity
    raiPolicyName: 'Microsoft.Default'
  }
}

output azureOpenAiUrl string = azureOpenAiResource.properties.endpoint
output resourceName string = azureOpenAiResource.name
output deploymentName string = azureOpenAiResource_model.name
