export enum CredentialEnum {
  Finished = 'finished',
  Action = 'action',
}

export enum Role {
  Author = 'author',
  Endorser = 'endorser',
}

export enum DidMethod {
  Indy = 'indy',
  Key = 'key',
  Web = 'web',
  Polygon = 'polygon',
}

export enum Network {
  Bcovrin_Testnet = 'bcovrin:testnet',
  Indicio_Testnet = 'indicio:testnet',
  Indicio_Demonet = 'indicio:demonet',
  Indicio_Mainnet = 'indicio:mainnet',
}

export enum AgentRole {
  RestRootAgentWithTenants = 'RestRootAgentWithTenants', // Basewallet // Better name: RestRootRestRootAgentWithTenantss
  RestRootAgent = 'RestRootAgent', // Dedicated // Better name: RestRootAgent
  TenantAgent = 'TenantAgent', // Tenant // Better name: RestTenantAgent
}
