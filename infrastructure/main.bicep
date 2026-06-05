@description('The name of the app that you wish to create.')
param applicationName string

@description('The name of the environment to deploy to.')
param env string

@description('Location for all resources.')
param location string = resourceGroup().location

@description('Azure Speech configuration.')
param azureSpeech {
  @description('SKU name for the Cognitive Services Speech account (e.g. F0, S0).')
  sku: string
}

var applicationNameWithEnvironment = '${applicationName}-${env}-${location}'
var azureSpeechResourceName = 'speech-${applicationNameWithEnvironment}'

module createAzureSpeechResource 'modules/azureSpeechResource.bicep' = {
  name: '${deployment().name}-azureSpeechResource'
  params: {
    location: location
    speechResourceName: azureSpeechResourceName
    subdomainName: 'speech-${applicationNameWithEnvironment}'
    skuSize: azureSpeech.sku
  }
}

output speechResourceName string = createAzureSpeechResource.outputs.resourceName
output speechRegion string = location
output speechEndpoint string = createAzureSpeechResource.outputs.endpoint
