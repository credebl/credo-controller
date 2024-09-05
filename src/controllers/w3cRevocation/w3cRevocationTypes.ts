import type { ClaimFormat, W3cCredentialSubject, W3cIssuer } from '@credo-ts/core'
import type { SingleOrArray } from '@credo-ts/core/build/utils'

export interface StatusListCredential {
  // Inside credential
  // '@context': string[]
  // id: string
  // type: Array<string>
  // issuer: string | W3cIssuer
  // issuanceDate: string
  // credentialSubject: SingleOrArray<W3cCredentialSubject>
  // Others
  format: ClaimFormat.LdpVc
  proofType: string
  verificationMethod: string
  credential: Credential
}
export interface Credential {
  '@context': string[]
  id: string
  type: Array<string>
  issuer: string | W3cIssuer
  issuanceDate: string
  credentialSubject: SingleOrArray<W3cCredentialSubject>
}
