@description('Application name prefix.')
param applicationName string

@description('Environment name.')
param env string

@description('Location for all resources.')
param location string = resourceGroup().location

@description('VM size SKU.')
param vmSize string = 'Standard_B2s_v2'

@description('Admin SSH username.')
param adminUsername string = 'azureuser'

@description('SSH public key for admin access.')
@secure()
param adminSshPublicKey string

@description('OS disk size in GB.')
param osDiskSizeGb int = 64

@description('Data disk size in GB.')
param dataDiskSizeGb int = 128

@description('Backup retention in days.')
param backupRetentionDays int = 30

var applicationNameWithEnvironment = '${applicationName}-${env}-${location}'

// Load cloud-init as base64
var cloudInitContent = loadFileAsBase64('./cloud-init.yaml')

// --- Networking ---

module nsg 'modules/networkSecurityGroup.bicep' = {
  name: '${deployment().name}-nsg'
  params: {
    location: location
    applicationName: applicationNameWithEnvironment
  }
}

module vnet 'modules/virtualNetwork.bicep' = {
  name: '${deployment().name}-vnet'
  params: {
    location: location
    applicationName: applicationNameWithEnvironment
    nsgId: nsg.outputs.nsgId
  }
}

module publicIp 'modules/publicIp.bicep' = {
  name: '${deployment().name}-pip'
  params: {
    location: location
    applicationName: applicationNameWithEnvironment
  }
}

module nic 'modules/networkInterface.bicep' = {
  name: '${deployment().name}-nic'
  params: {
    location: location
    applicationName: applicationNameWithEnvironment
    subnetId: vnet.outputs.subnetId
    publicIpId: publicIp.outputs.publicIpId
  }
}

// --- Compute ---

module vm 'modules/virtualMachine.bicep' = {
  name: '${deployment().name}-vm'
  params: {
    location: location
    applicationName: applicationNameWithEnvironment
    nicId: nic.outputs.nicId
    vmSize: vmSize
    adminUsername: adminUsername
    adminSshPublicKey: adminSshPublicKey
    osDiskSizeGb: osDiskSizeGb
    dataDiskSizeGb: dataDiskSizeGb
    customData: cloudInitContent
  }
}

// --- Secrets ---

module keyVault 'modules/keyVault.bicep' = {
  name: '${deployment().name}-kv'
  params: {
    location: location
    applicationName: applicationNameWithEnvironment
    vmPrincipalId: vm.outputs.vmPrincipalId
  }
}

// --- Monitoring ---

module logAnalytics 'modules/logAnalyticsWorkspace.bicep' = {
  name: '${deployment().name}-law'
  params: {
    location: location
    applicationName: applicationNameWithEnvironment
  }
}

module dcr 'modules/dataCollectionRule.bicep' = {
  name: '${deployment().name}-dcr'
  params: {
    location: location
    applicationName: applicationNameWithEnvironment
    workspaceId: logAnalytics.outputs.workspaceId
    vmId: vm.outputs.vmId
  }
}

// --- Backup ---

module backup 'modules/recoveryServicesVault.bicep' = {
  name: '${deployment().name}-rsv'
  params: {
    location: location
    applicationName: applicationNameWithEnvironment
    vmId: vm.outputs.vmId
    retentionDays: backupRetentionDays
  }
}

// --- Outputs ---

output vmPublicIp string = publicIp.outputs.publicIpAddress
output vmFqdn string = publicIp.outputs.fqdn
output vmName string = vm.outputs.vmName
output vmPrivateIp string = nic.outputs.privateIpAddress
output keyVaultName string = keyVault.outputs.keyVaultName
output keyVaultUri string = keyVault.outputs.keyVaultUri
output logAnalyticsWorkspaceName string = logAnalytics.outputs.workspaceName
output sshCommand string = 'ssh ${adminUsername}@<VM_PRIVATE_IP> (via Twingate)'
