@description('Application name used for naming.')
param applicationName string

@description('Email address for production alerts.')
param alertEmail string = ''

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ag-tinytoes-${applicationName}'
  location: 'global'
  properties: {
    groupShortName: 'tinytoes'
    enabled: !empty(alertEmail)
    emailReceivers: empty(alertEmail) ? [] : [
      {
        name: 'primary'
        emailAddress: alertEmail
        useCommonAlertSchema: true
      }
    ]
  }
}

output actionGroupId string = actionGroup.id
