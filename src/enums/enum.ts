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

export enum AgentType {
  AgentWithTenant = 'AgentWithTenant',
  AgentWithoutTenant = 'AgentWithoutTenant',
  TenantAgent = 'TenantAgent',
}
