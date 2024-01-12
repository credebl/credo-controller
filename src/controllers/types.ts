// eslint-disable-next-line import/order
import type {
  AutoAcceptCredential,
  AutoAcceptProof,
  CredentialFormatPayload,
  HandshakeProtocol,
  CredentialFormat,
  ReceiveOutOfBandInvitationConfig,
  OutOfBandDidCommService,
  DidResolutionMetadata,
  DidDocumentMetadata,
  ProofExchangeRecord,
  ProofFormatPayload,
  ProofFormat,
  CreateProofRequestOptions,
  DidRegistrationExtraOptions,
  DidDocument,
  DidRegistrationSecretOptions,
  InitConfig,
  WalletConfig,
  ModulesMap,
  DefaultAgentModules,
  CredentialProtocol,
  CredentialProtocolVersionType,
  // ProofAttributeInfo,
  // ProofPredicateInfo,
  ProofProtocol,
  ProofFormatService,
  ConnectionRecord,
  ExtractProofFormats,
  CredentialExchangeRecord,
  DidResolutionOptions,
  CreateCredentialOfferOptions,
  JsonLdCredentialFormat,
  JsonLdCredentialDetailFormat,
  JsonCredential,
  AgentMessage,
  Routing,
  Attachment
} from '@aries-framework/core'

import type {
  AnonCredsCredentialFormat,
  LegacyIndyCredentialFormat,
  V1PresentationPreviewAttributeOptions,
  V1PresentationPreviewPredicateOptions,
} from '@aries-framework/anoncreds'


import type { DIDDocument } from 'did-resolver'
import { Version } from './examples';

export type TenantConfig = Pick<InitConfig, 'label' | 'connectionImageUrl'> & {
  walletConfig: Pick<WalletConfig, 'id' | 'key' | 'keyDerivationMethod'>;
};


export interface AgentInfo {
  label: string
  endpoints: string[]
  isInitialized: boolean
  publicDid: void
  // publicDid?: {
  //   did: string
  //   verkey: string
  // }
}

export interface AgentMessageType {
  '@id': string
  '@type': string
  [key: string]: unknown
}

export interface DidResolutionResultProps {
  didResolutionMetadata: DidResolutionMetadata
  didDocument: DIDDocument | null
  didDocumentMetadata: DidDocumentMetadata
}

export interface ProofRequestMessageResponse {
  message: string
  proofRecord: ProofExchangeRecord
}

type CredentialFormats = [CredentialFormat]

// TODO: added type in protocolVersion
export interface ProposeCredentialOptions<T = never> {
  // protocolVersion: T extends never ? 'v1' | 'v2' : 'v1' | 'v2' | T
  connectionRecord: ConnectionRecord
  credentialFormats: {
    indy: {
      schemaIssuerDid: string
      schemaId: string
      schemaName: string
      schemaVersion: string
      credentialDefinitionId: string
      issuerDid: string
      attributes: {
        name: string
        value: string
      }[]
    }
  }
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
  connectionId: string
}

// export interface ProposeCredentialOptions<CPs extends CredentialProtocol[] = CredentialProtocol[]> extends BaseOptions {
//   connectionId: string
//   protocolVersion: CredentialProtocolVersionType<CPs>
//   credentialFormats: CredentialFormatPayload<CredentialFormatsFromProtocols<CPs>, 'createProposal'>
// }

export interface AcceptCredentialProposalOptions {
  credentialRecordId: string
  credentialFormats?: CredentialFormatPayload<CredentialFormats, 'acceptProposal'>
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
}

// TODO: added type in protocolVersion
export interface CreateOfferOptions {
  protocolVersion: string;
  connectionId: string
  credentialFormats: any
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
}

export interface CreateOfferOobOptions {
  protocolVersion: string;
  credentialFormats:CredentialFormatPayload<[LegacyIndyCredentialFormat | JsonLdCredentialFormat | AnonCredsCredentialFormat], "createOffer"> 
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
  goalCode?: string;
  parentThreadId?: string;
  willConfirm?: boolean;
  label?: string;
}
export interface CredentialCreateOfferOptions {
  credentialRecord: CredentialExchangeRecord;
  credentialFormats: JsonCredential
  options: any;
  attachmentId?: string;
}

export interface CreateProofRequestOobOptions {
  protocolVersion: string;
  proofFormats: any;
  goalCode?: string;
  parentThreadId?: string;
  willConfirm?: boolean;
  autoAcceptProof?: AutoAcceptProof;
  comment?: string;
  label?: string;
}

export interface OfferCredentialOptions {
  credentialFormats: {
    indy: {
      credentialDefinitionId: string
      attributes: {
        name: string
        value: string
      }[]
    }
  }
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
  connectionId: string
}

export interface V2OfferCredentialOptions {
  protocolVersion: string;
  connectionId: string;
  credentialFormats: {
    indy: {
      credentialDefinitionId: string
      attributes: {
        name: string
        value: string
      }[]
    }
  }
  autoAcceptCredential: string
}

export interface AcceptCredential {
  credentialRecord: CredentialExchangeRecord
}

export interface AcceptCredentialOfferOptions {
  credentialRecordId: string
  credentialFormats?: CredentialFormatPayload<CredentialFormats, 'acceptOffer'>
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
}

export interface AcceptCredentialRequestOptions {
  credentialRecord: CredentialExchangeRecord
  credentialFormats?: CredentialFormatPayload<CredentialFormats, 'acceptRequest'>
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
}

type ReceiveOutOfBandInvitationProps = Omit<ReceiveOutOfBandInvitationConfig, 'routing'>

export interface ReceiveInvitationProps extends ReceiveOutOfBandInvitationProps {
  invitation: OutOfBandInvitationSchema
}

export interface ReceiveInvitationByUrlProps extends ReceiveOutOfBandInvitationProps {
  invitationUrl: string
}

export interface AcceptInvitationConfig {
  autoAcceptConnection?: boolean
  reuseConnection?: boolean
  label?: string
  alias?: string
  imageUrl?: string
  mediatorId?: string
}

export interface OutOfBandInvitationSchema {
  '@id'?: string
  '@type': string
  label: string
  goalCode?: string
  goal?: string
  accept?: string[]
  handshake_protocols?: HandshakeProtocol[]
  services: Array<OutOfBandDidCommService | string>
  imageUrl?: string,
}

export interface ConnectionInvitationSchema {
  id?: string
  '@type': string
  label: string
  did?: string
  recipientKeys?: string[]
  serviceEndpoint?: string
  routingKeys?: string[]
  imageUrl?: string
}

// TODO: added type in protocolVersion
// export interface RequestProofOptions {
//   protocolVersion: 'v1' | 'v2'
//   connectionId: string
//   // TODO: added indy proof formate
//   proofFormats: ProofFormatPayload<[IndyProofFormat], 'createRequest'>
//   comment: string
//   autoAcceptProof?: AutoAcceptProof
//   parentThreadId?: string
// }

export interface RequestProofOptions {
  connectionId: string
  protocolVersion: string
  proofFormats: any
  comment: string
  autoAcceptProof: AutoAcceptProof
  goalCode?: string;
  parentThreadId?: string;
  willConfirm?: boolean;
}

// TODO: added type in protocolVersion
export interface RequestProofProposalOptions {
  connectionId: string
  // TODO: added indy proof formate
  proofFormats: ProofFormatPayload<[ProofFormat], 'createProposal'>
  goalCode?: string
  parentThreadId?: string
  autoAcceptProof?: AutoAcceptProof;
  comment?: string;
}

export interface AcceptProofProposal {
  proofRecordId: string
  proofFormats?: ProofFormatPayload<[ProofFormat], 'acceptProposal'>
  comment?: string
  autoAcceptProof?: AutoAcceptProof
  goalCode?: string;
  willConfirm?: boolean;
}

export interface GetTenantAgentOptions {
  tenantId: string
}

export interface DidCreateOptions {
  method?: string;
  did?: string;
  options?: DidRegistrationExtraOptions;
  secret?: DidRegistrationSecretOptions;
  didDocument?: DidDocument;
  seed?: any;
}

export interface ResolvedDid {
  didUrl: string
  options?: DidResolutionOptions
}

export interface DidCreate {
  seed: string;
  domain?: string;
  method?: string;
  did?: string;
  role?: string;
  options?: DidRegistrationExtraOptions;
  secret?: DidRegistrationSecretOptions;
  endorserDid?: string;
  didDocument?: DidDocument;
}

export interface CreateTenantOptions {
  config: Omit<TenantConfig, 'walletConfig'>,
  seed: string;
  method?: string;
  role?: string;
  endorserDid?: string;
  did?: string;
}

// export type WithTenantAgentCallback<AgentModules extends ModulesMap> = (
//   tenantAgent: TenantAgent<AgentModules>
// ) => Promise<void>

export interface WithTenantAgentOptions {
  tenantId: string;
  method: string;
  payload?: any;
}

export interface ReceiveConnectionsForTenants {
  tenantId: string;
  invitationId?: string;
}

export interface CreateInvitationOptions {
  label?: string;
  alias?: string;
  imageUrl?: string;
  goalCode?: string;
  goal?: string;
  handshake?: boolean;
  handshakeProtocols?: HandshakeProtocol[];
  messages?: AgentMessage[];
  multiUseInvitation?: boolean;
  autoAcceptConnection?: boolean;
  routing?: Routing;
  appendedAttachments?: Attachment[];
}

export interface EndorserTransaction {
  transaction: string | Record<string, unknown>,
  endorserDid: string
}

export interface DidNymTransaction {
  did: string
  nymRequest: string
}

export interface WriteTransaction {
  endorsedTransaction: string
  endorserDid?: string
  schema?: {
    issuerId: string
    name: string
    version: Version
    attributes: string[]
  },
  credentialDefinition?: {
    schemaId: string,
    issuerId: string,
    tag: string,
    value: unknown,
    type: string
  }
}


