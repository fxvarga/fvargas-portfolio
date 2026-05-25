@description('Location for the resource.')
param location string

@description('Application name used for naming.')
param applicationName string

@description('VM resource ID to protect.')
param vmId string

@description('Backup retention in days.')
param retentionDays int = 30

var vaultName = 'rsv-${applicationName}'

resource vault 'Microsoft.RecoveryServices/vaults@2024-01-01' = {
  name: vaultName
  location: location
  sku: {
    name: 'RS0'
    tier: 'Standard'
  }
  properties: {
    publicNetworkAccess: 'Enabled'
  }
}

resource backupPolicy 'Microsoft.RecoveryServices/vaults/backupPolicies@2024-01-01' = {
  parent: vault
  name: 'policy-daily-${applicationName}'
  properties: {
    backupManagementType: 'AzureIaasVM'
    instantRpRetentionRangeInDays: 2
    schedulePolicy: {
      schedulePolicyType: 'SimpleSchedulePolicy'
      scheduleRunFrequency: 'Daily'
      scheduleRunTimes: [
        '2026-01-01T04:00:00Z'
      ]
    }
    retentionPolicy: {
      retentionPolicyType: 'LongTermRetentionPolicy'
      dailySchedule: {
        retentionTimes: [
          '2026-01-01T04:00:00Z'
        ]
        retentionDuration: {
          count: retentionDays
          durationType: 'Days'
        }
      }
    }
  }
}

resource protectedItem 'Microsoft.RecoveryServices/vaults/backupFabrics/protectionContainers/protectedItems@2024-01-01' = {
  name: '${vaultName}/Azure/iaasvmcontainer;iaasvmcontainerv2;${resourceGroup().name};${last(split(vmId, '/'))}/vm;iaasvmcontainerv2;${resourceGroup().name};${last(split(vmId, '/'))}'
  properties: {
    protectedItemType: 'Microsoft.Compute/virtualMachines'
    policyId: backupPolicy.id
    sourceResourceId: vmId
  }

}

output vaultName string = vault.name
output vaultId string = vault.id
