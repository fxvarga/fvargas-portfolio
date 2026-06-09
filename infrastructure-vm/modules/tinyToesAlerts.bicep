@description('Location for scheduled query rules.')
param location string

@description('Application name used for naming.')
param applicationName string

@description('Application Insights resource ID.')
param appInsightsId string

@description('Alert action group resource ID.')
param actionGroupId string

var enabled = !empty(actionGroupId)

resource apiFailures 'Microsoft.Insights/scheduledQueryRules@2023-12-01' = {
  name: 'sqr-tinytoes-api-failures-${applicationName}'
  location: location
  properties: {
    displayName: 'TinyToes API failures'
    description: 'Alerts when failed API requests exceed launch threshold.'
    enabled: enabled
    severity: 2
    scopes: [appInsightsId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: 'requests | where timestamp > ago(15m) | where success == false | summarize Count=count()'
          timeAggregation: 'Total'
          metricMeasureColumn: 'Count'
          operator: 'GreaterThan'
          threshold: 5
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: enabled ? [actionGroupId] : []
    }
  }
}

resource paymentErrors 'Microsoft.Insights/scheduledQueryRules@2023-12-01' = {
  name: 'sqr-tinytoes-payment-errors-${applicationName}'
  location: location
  properties: {
    displayName: 'TinyToes payment errors'
    description: 'Alerts on Stripe or Apple payment verification failures.'
    enabled: enabled
    severity: 1
    scopes: [appInsightsId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: 'customEvents | where timestamp > ago(15m) | where name in ("payment_error", "gift_code_redemption_failed") | summarize Count=count()'
          timeAggregation: 'Total'
          metricMeasureColumn: 'Count'
          operator: 'GreaterThan'
          threshold: 2
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: enabled ? [actionGroupId] : []
    }
  }
}

resource frontendCrashes 'Microsoft.Insights/scheduledQueryRules@2023-12-01' = {
  name: 'sqr-tinytoes-frontend-crashes-${applicationName}'
  location: location
  properties: {
    displayName: 'TinyToes frontend crashes'
    description: 'Alerts when frontend exceptions exceed launch threshold.'
    enabled: enabled
    severity: 2
    scopes: [appInsightsId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: 'exceptions | where timestamp > ago(15m) | where client_Type == "Browser" | summarize Count=count()'
          timeAggregation: 'Total'
          metricMeasureColumn: 'Count'
          operator: 'GreaterThan'
          threshold: 5
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: enabled ? [actionGroupId] : []
    }
  }
}
