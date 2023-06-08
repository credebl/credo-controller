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
  CreateCredentialOfferOptions
} from '@aries-framework/core'

import type {
  V1PresentationPreviewAttributeOptions,
  V1PresentationPreviewPredicateOptions,
} from '@aries-framework/anoncreds'


import type { DIDDocument } from 'did-resolver'

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
  credentialRecord: CredentialExchangeRecord
  credentialFormats?: {
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
}

// TODO: added type in protocolVersion
export interface CreateOfferOptions {
  connectionId: string
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

export interface AcceptCredential {
  credentialRecord: CredentialExchangeRecord
}

export interface AcceptCredentialOfferOptions {
  credentialRecord: CredentialExchangeRecord
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
  invitation: Omit<OutOfBandInvitationSchema, 'appendedAttachments'>
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
  imageUrl?: string
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

export interface RequestProofOptions extends CreateProofRequestOptions {
  connectionRecord: ConnectionRecord
  connectionId: string
  protocolVersion: 'v2'
  proofRequestOptions: {
    name: string
    version: string
    requestedAttributes?: { [key: string]: V1PresentationPreviewAttributeOptions }
    requestedPredicates?: { [key: string]: V1PresentationPreviewPredicateOptions }
  }
}

// TODO: added type in protocolVersion
export interface RequestProofProposalOptions {
  connectionRecord: ConnectionRecord
  attributes: V1PresentationPreviewAttributeOptions[]
  predicates: V1PresentationPreviewPredicateOptions[]
  comment?: string
  autoAcceptProof?: AutoAcceptProof
  protocolVersion: 'v1'
  // TODO: added indy proof formate
  proofFormats: ProofFormatPayload<[ProofFormat], 'createProposal'>
  goalCode: string
  parentThreadId: string
}

export interface AcceptProofProposal {
  proofRecord: ProofExchangeRecord
  proofFormats?: ProofFormatPayload<[ProofFormat], 'acceptProposal'>
  comment: string
  autoAcceptProof: AutoAcceptProof
}

// export interface GetTenantAgentOptions {
//   tenantId: string
// }

export interface DidCreateOptions {
  method?: string;
  did?: string;
  options?: DidRegistrationExtraOptions;
  secret?: DidRegistrationSecretOptions;
  didDocument?: DidDocument;
}

export interface ResolvedDid {
  didUrl: string
  options?: DidResolutionOptions
}

// export interface CreateTenantOptions {
//   config: Omit<TenantConfig, 'walletConfig'>
// }

// export type WithTenantAgentCallback<AgentModules extends ModulesMap> = (
//   tenantAgent: TenantAgent<AgentModules>
// ) => Promise<void>
