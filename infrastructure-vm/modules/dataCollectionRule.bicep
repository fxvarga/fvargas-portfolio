@description('Location for the resource.')
param location string

@description('Application name used for naming.')
param applicationName string

@description('Log Analytics workspace ID.')
param workspaceId string

@description('VM resource ID to associate the DCR with.')
param vmId string

resource dcr 'Microsoft.Insights/dataCollectionRules@2023-03-11' = {
  name: 'dcr-${applicationName}'
  location: location
  properties: {
    dataSources: {
      syslog: [
        {
          name: 'syslog'
          streams: [
            'Microsoft-Syslog'
          ]
          facilityNames: [
            'auth'
            'authpriv'
            'daemon'
            'kern'
            'syslog'
          ]
          logLevels: [
            'Warning'
            'Error'
            'Critical'
            'Alert'
            'Emergency'
          ]
        }
      ]
      performanceCounters: [
        {
          name: 'perfCounters'
          streams: [
            'Microsoft-Perf'
          ]
          samplingFrequencyInSeconds: 60
          counterSpecifiers: [
            '\\Processor Information(_Total)\\% Processor Time'
            '\\Memory\\Available Bytes'
            '\\Memory\\% Used Memory'
            '\\LogicalDisk(_Total)\\% Free Space'
            '\\LogicalDisk(_Total)\\Disk Bytes/sec'
          ]
        }
      ]
    }
    destinations: {
      logAnalytics: [
        {
          workspaceResourceId: workspaceId
          name: 'law-destination'
        }
      ]
    }
    dataFlows: [
      {
        streams: [
          'Microsoft-Syslog'
          'Microsoft-Perf'
        ]
        destinations: [
          'law-destination'
        ]
      }
    ]
  }
}

resource existingVm 'Microsoft.Compute/virtualMachines@2024-03-01' existing = {
  name: last(split(vmId, '/'))
}

resource dcrAssociation 'Microsoft.Insights/dataCollectionRuleAssociations@2023-03-11' = {
  name: 'dcra-${applicationName}'
  scope: existingVm
  properties: {
    dataCollectionRuleId: dcr.id
  }
}

output dcrId string = dcr.id
