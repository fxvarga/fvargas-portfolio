@description('Location for the workbook.')
param location string

@description('Application Insights resource ID used by workbook queries.')
param appInsightsId string

var workbookData = json(loadTextContent('../workbooks/tinytoes-ceo-dashboard.workbook.json'))

resource workbook 'Microsoft.Insights/workbooks@2022-04-01' = {
  name: guid(resourceGroup().id, 'tinytoes-ceo-dashboard')
  location: location
  kind: 'shared'
  properties: {
    displayName: 'TinyToes CEO Dashboard'
    category: 'workbook'
    sourceId: appInsightsId
    serializedData: string(workbookData)
    version: '1.0'
  }
}

output workbookId string = workbook.id
