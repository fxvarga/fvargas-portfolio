param applicationName string
param staticEndpoint string
param appServiceName string
param logAnalyticsWorkspaceName string

var cdnName = 'afd-${applicationName}'
var cdnProfileSku = 'Standard_AzureFrontDoor'

var spaEndpointName = 'fde-${applicationName}'
var apiEndpointName = 'fde-${applicationName}-api'
var spaOriginGroupName = 'default-origin-group'
var apiOriginGroupName = 'api-origin-group'
var spaOriginName = 'default-origin'
var apiOriginName = 'api-origin'
var spaRouteName = 'default-route'
var apiRouteName = 'api-route'



resource appService 'Microsoft.Web/sites@2023-01-01' existing = {
  name: appServiceName
}


resource frontDoorProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnName
  location: 'Global'
  sku: {
    name: cdnProfileSku
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    originResponseTimeoutSeconds: 240
  }
}

resource spaEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  name: spaEndpointName
  parent: frontDoorProfile
  location: 'Global'
  properties: {
    enabledState: 'Enabled'
  }
}

resource apiEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  name: apiEndpointName
  parent: frontDoorProfile
  location: 'Global'
  properties: {
    enabledState: 'Enabled'
  }
}


resource spaFrontDoorOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  name: spaOriginGroupName
  parent: frontDoorProfile
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Http'
      probeIntervalInSeconds: 100
    }
  }
}

resource spaFrontDoorOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  name: spaOriginName
  parent: spaFrontDoorOriginGroup
  properties: {
    hostName: staticEndpoint
    httpPort: 80
    httpsPort: 443
    originHostHeader: staticEndpoint
    priority: 1
    weight: 1000
    // enforceCertificateNameCheck: true
  }
}

resource apiFrontDoorOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  name: apiOriginGroupName
  parent: frontDoorProfile
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
    }
    // Commenting out for now so that we can relieve some pressure on the API
    // healthProbeSettings: {
    //   probePath: '/healthcheck'
    //   probeRequestType: 'HEAD'
    //   probeProtocol: 'Https'
    //   probeIntervalInSeconds: 255
    // }
  }
}

resource apiFrontDoorOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  name: apiOriginName
  parent: apiFrontDoorOriginGroup
  properties: {
    hostName: appService.properties.defaultHostName
    httpPort: 80
    httpsPort: 443
    originHostHeader: appService.properties.defaultHostName
    priority: 1
    weight: 1000
    enforceCertificateNameCheck: true
  }
}

resource spaFrontDoorRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  name: spaRouteName
  parent: spaEndpoint
  dependsOn: [
    spaFrontDoorOrigin // This explicit dependency is required to ensure that the origin group is not empty when the route is created.
  ]
  properties: {
    originGroup: {
      id: spaFrontDoorOriginGroup.id
    }
    customDomains: []
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'MatchRequest'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    cacheConfiguration: {
      queryStringCachingBehavior: 'UseQueryString'
      compressionSettings: {
        isCompressionEnabled: true
        contentTypesToCompress: [
          'application/eot'
          'application/font'
          'application/font-sfnt'
          'application/javascript'
          'application/json'
          'application/opentype'
          'application/otf'
          'application/pkcs7-mime'
          'application/truetype'
          'application/ttf'
          'application/vnd.ms-fontobject'
          'application/xhtml+xml'
          'application/xml'
          'application/xml+rss'
          'application/x-font-opentype'
          'application/x-font-truetype'
          'application/x-font-ttf'
          'application/x-httpd-cgi'
          'application/x-javascript'
          'application/x-mpegurl'
          'application/x-opentype'
          'application/x-otf'
          'application/x-perl'
          'application/x-ttf'
          'font/eot'
          'font/ttf'
          'font/otf'
          'font/opentype'
          'image/svg+xml'
          'text/css'
          'text/csv'
          'text/html'
          'text/javascript'
          'text/js'
          'text/plain'
          'text/richtext'
          'text/tab-separated-values'
          'text/xml'
          'text/x-script'
          'text/x-component'
          'text/x-java-source'
        ]
      }
    }
  }
}

resource apiFrontDoorRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  name: apiRouteName
  parent: apiEndpoint
  dependsOn: [
    apiFrontDoorOrigin // This explicit dependency is required to ensure that the origin group is not empty when the route is created.
  ]
  properties: {
    originGroup: {
      id: apiFrontDoorOriginGroup.id
    }
    supportedProtocols: [
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
  }
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsWorkspaceName
}

resource service 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: frontDoorProfile
  name: 'audit-${cdnName}'
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'FrontdoorAccessLog'
        enabled: true
      }
      {
        category: 'FrontdoorWebApplicationFirewallLog'
        enabled: true
      }
    ]
  }
}

output cdnHostName string = spaEndpoint.properties.hostName
output apiHostName string = apiEndpoint.properties.hostName
output afdIdentity string = frontDoorProfile.identity.principalId
