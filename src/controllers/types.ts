// eslint-disable-next-line import/order
import type {
  AutoAcceptCredential,
  AutoAcceptProof,
  CredentialFormatPayload,
  HandshakeProtocol,
  CredentialFormat,
  PresentationPreviewAttributeOptions,
  PresentationPreviewPredicateOptions,
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
  ProofAttributeInfo,
  ProofPredicateInfo,
  ProofProtocol,
  ProofFormatService
} from '@aries-framework/core'
import { CredentialFormatsFromProtocols } from '@aries-framework/core/build/modules/credentials/protocol/CredentialProtocolOptions';
import { TenantAgent } from '@aries-framework/tenants/build/TenantAgent';
import type { DIDDocument } from 'did-resolver'
import { BaseOptions } from '@aries-framework/core';

export type TenantConfig = Pick<InitConfig, 'label' | 'connectionImageUrl'> & {
  walletConfig: Pick<WalletConfig, 'id' | 'key' | 'keyDerivationMethod'>;
};


export interface AgentInfo {
  label: string
  endpoints: string[]
  isInitialized: boolean
  publicDid?: {
    did: string
    verkey: string
  }
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
  protocolVersion: T extends never ? 'v1' | 'v2' : 'v1' | 'v2' | T
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
export interface CreateOfferOptions<T = never> {
  protocolVersion: T extends never ? 'v1' | 'v2' : 'v1' | 'v2' | T
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

export interface OfferCredentialOptions<T = never> {
  protocolVersion: T extends never ? 'v1' | 'v2' : 'v1' | 'v2' | T
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

export interface AcceptCredentialOfferOptions {
  credentialFormats?: CredentialFormatPayload<CredentialFormats, 'acceptOffer'>
  autoAcceptCredential?: AutoAcceptCredential
  comment?: string
}

export interface AcceptCredentialRequestOptions {
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

export interface RequestProofOptions<T extends string> extends CreateProofRequestOptions<ProofProtocol<ProofFormatService<ProofFormat>[]>[]> {
  connectionId: string
  protocolVersion: T extends never ? 'v1' | 'v2' : 'v1' | 'v2' | T
  proofRequestOptions: {
    name: string
    version: string
    requestedAttributes?: { [key: string]: ProofAttributeInfo }
    requestedPredicates?: { [key: string]: ProofPredicateInfo }
  }
}

// TODO: added type in protocolVersion
export interface RequestProofProposalOptions {
  connectionId: string
  attributes: PresentationPreviewAttributeOptions[]
  predicates: PresentationPreviewPredicateOptions[]
  comment?: string
  autoAcceptProof?: AutoAcceptProof
  protocolVersion: 'v2'
  // TODO: added indy proof formate
  proofFormats: ProofFormatPayload<[ProofFormat], 'createProposal'>
  goalCode: string
  parentThreadId: string
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

// export interface CreateTenantOptions {
//   config: Omit<TenantConfig, 'walletConfig'>
// }

// export type WithTenantAgentCallback<AgentModules extends ModulesMap> = (
//   tenantAgent: TenantAgent<AgentModules>
// ) => Promise<void>
