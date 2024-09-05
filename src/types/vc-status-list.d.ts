declare module '@digitalbazaar/vc-status-list' {
  export class StatusList {
    public static decode({ encodedList }: { encodedList: any }): Promise<StatusList>
    public constructor({ length, buffer }?: { length: any; buffer: any })
    public bitstring: any
    public length: any
    public setStatus(index: any, status: any): any
    public getStatus(index: any): any
    public encode(): Promise<any>
  }

  export function createList({ length }: { length: any }): Promise<StatusList>
  export function decodeList({ encodedList }: { encodedList: any }): Promise<StatusList>
  /**
   * Creates a StatusList Credential.
   *
   * @param {object} options - Options to use.
   * @param {string} options.id - The id for StatusList Credential.
   * @param {StatusList} options.list - An instance of StatusList.
   * @param {string} options.statusPurpose - The purpose of the status entry.
   *
   * @returns {object} The resulting `StatusList Credential`.
   */
  export function createCredential({
    id,
    list,
    statusPurpose,
  }: {
    id: string
    list: StatusList
    statusPurpose: string
  }): object
  export function checkStatus({
    credential,
    documentLoader,
    suite,
    verifyStatusListCredential,
    verifyMatchingIssuers,
  }?: {
    credential: any
    documentLoader: any
    suite: any
    verifyStatusListCredential?: any
    verifyMatchingIssuers?: any
  }): Promise<
    | {
        verified: any
        results: any
      }
    | {
        verified: boolean
        error: any
      }
  >
  export function statusTypeMatches({ credential }?: { credential: any }): boolean
  export function assertStatusList2021Context({ credential }?: { credential: any }): void
  /**
   * Gets the `credentialStatus` of a credential based on its status purpose
   * (`statusPurpose`).
   *
   * @param {object} options - Options to use.
   * @param {object} options.credential - A VC.
   * @param {'revocation'|'suspension'} options.statusPurpose - A
   *   `statusPurpose`.
   *
   * @throws If the `credentialStatus` is invalid or missing.
   *
   * @returns {object} The resulting `credentialStatus`.
   */
  export function getCredentialStatus({
    credential,
    statusPurpose,
  }?: {
    credential: object
    statusPurpose: 'revocation' | 'suspension'
  }): object
}
