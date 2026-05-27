using 'main.bicep'

param applicationName = 'fev-fevargas'

param env = 'prod'

param location = 'eastus2'

param vmSize = 'Standard_B2s_v2'

param adminUsername = 'azureuser'

param adminSshPublicKey = readEnvironmentVariable('VM_SSH_PUBLIC_KEY', '')

param osDiskSizeGb = 64

param dataDiskSizeGb = 128

param backupRetentionDays = 30
