using 'main.bicep'

param applicationName  = 'fv-portfolio'

param env = 'prod'

param location  = 'eastus2'

param storageSKU  = 'Standard_RAGRS'

param appServicePlan  = {
  osPlatform: 'windows'
  sku: 'P0V3'
  capacity: 1
}

param azureAdSettings =   {
  clientId: '90cb10fe-6d3c-4b89-a1b2-e7c7125d7a18'
  audience: 'https://themaimai.onmicrosoft.com'
}

param baseUri = 'https://fernando-vargas.com'

param featureFlags = [
  {
    id: 'OutageBanner'
    description: ''
    enabled: false
  }
  {
    id: 'DevMode'
    description: ''
    enabled: false
  }
]

param azureOpenAi4o = {
  deploymentName: 'gpt-4o-mini'
  apiVersion: '2024-07-18'
  capacity: 100
}

param azureOpenAiEmbeddings = {
  deploymentName: 'text-embedding-ada-002'
  apiVersion: '2'
  capacity: 100
}
