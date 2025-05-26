@description('The name of the function app being created')
param applicationName string

@description('The vNet name for this security group')
param subNetName string

@description('Specifies the Azure region to create the resource')
param location string

var networkSecurityGroupName = 'nsg-${applicationName}-${subNetName}'

resource networkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: networkSecurityGroupName
  location: location
}

output networkSecurityGroupId string = networkSecurityGroup.id
