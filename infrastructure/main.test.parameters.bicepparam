using 'main.bicep'

param applicationName = 'fv-portfolio'

param env = 'prod'

param location = 'eastus2'

param azureSpeech = {
  sku: 'S0'
}
