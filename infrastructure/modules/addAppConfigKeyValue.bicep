@description('The name of the app config store to add the value to.')
param configStoreName string

param keyValues array = []

param featureFlags array = []

resource configurationStores 'Microsoft.AppConfiguration/configurationStores@2023-03-01' existing = {
  name: configStoreName
}

resource configStoreKeyValues 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = [for item in keyValues: {
  parent: configurationStores
  name: item.name
  properties: {
    value: item.value
    contentType: ''
  }
}]

resource configStoreFeatureFlags 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = [for featureFlag in featureFlags: {
  parent: configurationStores
  name: '.appconfig.featureflag~2F${featureFlag.id}'
  properties: {
    value: string(featureFlag)
    contentType: 'application/vnd.microsoft.appconfig.ff+json;charset=utf-8'
  }
}]
