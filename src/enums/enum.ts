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

export enum NetworkName {
  Bcovrin = 'bcovrin',
  Indicio = 'indicio',
}

export enum IndicioTransactionAuthorAgreement {
  Indicio_Testnet_Mainnet_Version = '1.0',
  Indicio_Demonet_Version = '1.3',
}

export enum Network {
  Bcovrin_Testnet = 'bcovrin:testnet',
  Indicio_Testnet = 'indicio:testnet',
  Indicio_Demonet = 'indicio:demonet',
  Indicio_Mainnet = 'indicio:mainnet',
}

export enum IndicioAcceptanceMechanism {
  Wallet_Agreement = 'wallet_agreement',
  Accept = 'accept',
}
