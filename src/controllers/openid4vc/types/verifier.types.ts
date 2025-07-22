/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { DifPresentationExchangeDefinitionV2 } from '@credo-ts/core'
import type { SubmissionRequirement } from '@sphereon/pex-models'

export enum ResponseModeEnum {
  DIRECT_POST = 'direct_post',
  DIRECT_POSJWT = 'direct_post.jwt',
}

export interface OpenId4VcJwtIssuerDid {
  method: 'did'
  didUrl: string
}

export interface OpenId4VcIssuerX5c {
  method: 'x5c'
  x5c: string[]
}

export interface JwtObject {
  alg: string[]
}

export interface LdpObject {
  proof_type: string[]
}

export interface DiObject {
  proof_type: string[]
  cryptosuite: string[]
}

export interface SdJwtObject {
  'sd-jwt_alg_values'?: string[]
  'kb-jwt_alg_values'?: string[]
}

export interface MsoMdocObject {
  alg: string[]
}

export interface Format {
  jwt?: JwtObject
  jwt_vc?: JwtObject
  jwt_vc_json?: JwtObject
  jwt_vp?: JwtObject
  jwt_vp_json?: JwtObject
  ldp?: LdpObject
  ldp_vc?: LdpObject
  ldp_vp?: LdpObject
  di?: DiObject
  di_vc?: DiObject
  di_vp?: DiObject
  'vc+sd-jwt'?: SdJwtObject
  mso_mdoc?: MsoMdocObject
}

export enum RulesEnum {
  All = 'all',
  Pick = 'pick',
}

export interface SubmissionRequirementModel extends SubmissionRequirement {
  from_nested?: SubmissionRequirementModel[]
}

export enum Optionality {
  Required = 'required',
  Preferred = 'preferred',
}

export enum Directives {
  Required = 'required',
  Allowed = 'allowed',
  Disallowed = 'disallowed',
}

export interface PdStatus {
  directive?: Directives
}

export interface Statuses {
  active?: PdStatus
  suspended?: PdStatus
  revoked?: PdStatus
}

export interface HolderSubject {
  field_id: string[]
  directive: Optionality
}

export interface FilterV2 {
  const?: boolean | number | string
  enum?: Array<number | string>
  exclusiveMinimum?: number | string
  exclusiveMaximum?: number | string
  format?: string
  formatMaximum?: string
  formatMinimum?: string
  formatExclusiveMaximum?: string
  formatExclusiveMinimum?: string
  minLength?: number
  maxLength?: number
  minimum?: number | string
  maximum?: number | string
  not?: Record<string, unknown>
  pattern?: string
  type?: string
  contains?: FilterV2
  items?: FilterV2
}

export interface FieldV2 {
  id?: string
  path: string[]
  purpose?: string
  filter?: FilterV2
  predicate?: Optionality
  intent_to_retain?: boolean
  name?: string
  optional?: boolean
}

export interface ConstraintsV2 {
  limit_disclosure?: Optionality
  statuses?: Statuses
  fields?: FieldV2[]
  subject_is_issuer?: Optionality
  is_holder?: HolderSubject[]
  same_subject?: HolderSubject[]
}

export interface Issuance {
  [key: string]: any
  manifest?: string
}

export interface InputDescriptorV2Model {
  id: string
  name?: string
  purpose?: string
  format?: Format
  group?: string[]
  issuance?: Issuance[]
  constraints: ConstraintsV2
}

export interface DifPresentationExchangeDefinitionV2Model extends DifPresentationExchangeDefinitionV2 {
  format?: Format
  submission_requirements?: SubmissionRequirementModel[]
  input_descriptors: InputDescriptorV2Model[]
  frame?: object
}

export interface PresentationDefinition {
  definition: DifPresentationExchangeDefinitionV2Model
}

export interface CreateAuthorizationRequest {
  verifierId: string
  verifierDid: string
  presentationExchange: PresentationDefinition
  responseMode?: ResponseModeEnum
}

export class OpenId4VcSiopVerifierClientMetadata {
  client_name?: string
  logo_uri?: string
}

export class OpenId4VcSiopCreateVerifierOptions {
  verifierId?: string
  clientMetadata?: OpenId4VcSiopVerifierClientMetadata
}

export class OpenId4VcUpdateVerifierRecordOptions {
  verifierId!: string
  clientMetadata?: OpenId4VcSiopVerifierClientMetadata
}
