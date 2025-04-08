export enum CredentialEnum {
  Finished = 'finished',
  Action = 'action',
  Failed = 'failed',
  Wait = 'wait',
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
  Peer = 'peer',
}

export enum NetworkName {
  Bcovrin = 'bcovrin',
  Indicio = 'indicio',
}

export enum IndicioTransactionAuthorAgreement {
  Indicio_Testnet_Mainnet_Version = '1.0',
  // To do: now testnet has also moved to version 1.3 of TAA
  Indicio_Demonet_Version = '1.3',
}

export enum Network {
  Bcovrin_Testnet = 'bcovrin:testnet',
  Indicio_Testnet = 'indicio:testnet',
  Indicio_Demonet = 'indicio:demonet',
  Indicio_Mainnet = 'indicio:mainnet',
}

export enum NetworkTypes {
  Testnet = 'testnet',
  Demonet = 'demonet',
  Mainnet = 'mainnet',
}

export enum IndicioAcceptanceMechanism {
  Wallet_Agreement = 'wallet_agreement',
  Accept = 'accept',
}

export enum EndorserMode {
  Internal = 'internal',
  External = 'external',
}

export enum SchemaError {
  NotFound = 'notFound',
  UnSupportedAnonCredsMethod = 'unsupportedAnonCredsMethod',
}

export enum HttpStatusCode {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  InternalServerError = 500,
}

export declare enum CustomHandshakeProtocol {
  DidExchange = 'https://didcomm.org/didexchange/1.1',
  Connections = 'https://didcomm.org/connections/1.0',
}

export enum CredentialContext {
  V1 = 'https://www.w3.org/2018/credentials/v1',
  V2 = 'https://www.w3.org/ns/credentials/v2',
}

export enum CredentialType {
  VerifiableCredential = 'VerifiableCredential',
  BitstringStatusListCredential = 'BitstringStatusListCredential',
}
export enum RevocationListType {
  Bitstring = 'BitstringStatusList',
}

export enum CredentialStatusListType {
  CredentialStatusList2017 = 'CredentialStatusList2017',
}
export enum SignatureType {
  Ed25519Signature2018 = 'Ed25519Signature2018',
}

export enum W3CRevocationStatus {
  Revoked = 'REVOCATION',
  Suspended = 'SUSPENSION',
}
