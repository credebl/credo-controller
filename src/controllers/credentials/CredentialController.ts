import { AutoAcceptCredential, CREDENTIALS_CONTEXT_V1_URL, ConnectionRecord, ConnectionState, CredentialExchangeRecord, CredentialExchangeRecordProps, CredentialFormat, CredentialPreviewAttribute, CredentialProtocolVersionType, CustomConnectionTags, CustomCredentialTags, DefaultConnectionTags, DidExchangeRole, DidExchangeState, HandshakeProtocol, JsonCredential, JsonLdCredentialDetailFormat, JsonLdCredentialFormatService, KeyType, ProofsProtocolVersionType, TypedArrayEncoder, V2CredentialPreview, W3cCredentialService, utils } from '@aries-framework/core'

import { CredentialRepository, CredentialState, Agent, RecordNotFoundError } from '@aries-framework/core'
import { Body, Controller, Delete, Get, Path, Post, Res, Route, Tags, TsoaResponse, Example, Query } from 'tsoa'
import { injectable } from 'tsyringe'
import {
  LegacyIndyCredentialFormatService,
  V1CredentialProtocol
} from '@aries-framework/anoncreds'

import { CredentialExchangeRecordExample, RecordId } from '../examples'
import {
  AcceptCredentialRequestOptions,
  ProposeCredentialOptions,
  AcceptCredentialProposalOptions,
  AcceptCredentialOfferOptions,
  CreateOfferOptions,
  AcceptCredential,
  CreateOfferOobOptions,
  CredentialCreateOfferOptions,
} from '../types'
import { OutOfBandController } from '../outofband/OutOfBandController'



@Tags('Credentials')
@Route('/credentials')
@injectable()
export class CredentialController extends Controller {
  private agent: Agent
  private outOfBandController: OutOfBandController;

  // private v1CredentialProtocol: V1CredentialProtocol

  public constructor(agent: Agent, outOfBandController: OutOfBandController) {
    super()
    this.agent = agent
    this.outOfBandController = outOfBandController
    // this.v1CredentialProtocol = v1CredentialProtocol
  }

  /**
   * Retrieve all credential exchange records
   *
   * @returns CredentialExchangeRecord[]
   */
  @Example<CredentialExchangeRecordProps[]>([CredentialExchangeRecordExample])
  @Get('/')
  public async getAllCredentials(
    @Query('threadId') threadId?: string,
    @Query('connectionId') connectionId?: string,
    @Query('state') state?: CredentialState
  ) {
    const credentialRepository = this.agent.dependencyManager.resolve(CredentialRepository)

    const credentials = await credentialRepository.findByQuery(this.agent.context, {
      connectionId,
      threadId,
      state,
    })

    return credentials.map((c) => c.toJSON())
  }

  @Get('/w3c')
  public async getAllW3c() {
    const w3cCredentialService = await this.agent.dependencyManager.resolve(W3cCredentialService)
    console.log(await w3cCredentialService.getAllCredentialRecords(this.agent.context))
    return await w3cCredentialService.getAllCredentialRecords(this.agent.context)
  }

  @Get('/w3c/:id')
  public async getW3cById(
    @Path('id') id: string
  ) {
    const w3cCredentialService = await this.agent.dependencyManager.resolve(W3cCredentialService)
    // console.log(await w3cCredentialService.getAllCredentialRecords(this.agent.context))
    return await w3cCredentialService.getCredentialRecordById(this.agent.context, id);
  }

  /**
   * Retrieve credential exchange record by credential record id
   *
   * @param credentialRecordId
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Get('/:credentialRecordId')
  public async getCredentialById(
    @Path('credentialRecordId') credentialRecordId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const credential = await this.agent.credentials.getById(credentialRecordId)
      return credential.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record id "${credentialRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Initiate a new credential exchange as holder by sending a propose credential message
   * to the connection with a specified connection id.
   *
   * @param options
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/propose-credential')
  public async proposeCredential(
    @Body() proposeCredentialOptions: ProposeCredentialOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const credential = await this.agent.credentials.proposeCredential({
        connectionId: proposeCredentialOptions.connectionId,
        protocolVersion: 'v1' as CredentialProtocolVersionType<[]>,
        credentialFormats: proposeCredentialOptions.credentialFormats,
        autoAcceptCredential: proposeCredentialOptions.autoAcceptCredential,
        comment: proposeCredentialOptions.comment
      })
      return credential
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `connection with connection record id "${proposeCredentialOptions.connectionId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Accept a credential proposal as issuer by sending an accept proposal message
   * to the connection associated with the credential exchange record.
   *
   * @param credentialRecordId credential identifier
   * @param options
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/accept-proposal')
  public async acceptProposal(
    // @Path('credentialRecordId') credentialRecordId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredentialProposal: AcceptCredentialProposalOptions
  ) {
    try {

      const credential = await this.agent.credentials.acceptProposal({
        credentialRecordId: acceptCredentialProposal.credentialRecordId,
        credentialFormats: acceptCredentialProposal.credentialFormats,
        autoAcceptCredential: acceptCredentialProposal.autoAcceptCredential,
        comment: acceptCredentialProposal.comment
      })

      return credential
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record id "${acceptCredentialProposal.credentialRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Initiate a new credential exchange as issuer by creating a credential offer
   * without specifying a connection id
   *
   * @param options
   * @returns AgentMessage, CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/create-offer')
  public async createOffer(
    @Body() createOfferOptions: CreateOfferOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const offer = await this.agent.credentials.offerCredential({
        connectionId: createOfferOptions.connectionId,
        protocolVersion: createOfferOptions.protocolVersion as CredentialProtocolVersionType<[]>,
        credentialFormats: createOfferOptions.credentialFormats,
        autoAcceptCredential: createOfferOptions.autoAcceptCredential
      })
      console.log(offer)
      return offer;
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Post('/create-offer-oob')
  public async createOfferOob(
    @Body() outOfBandOption: CreateOfferOobOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const issuerId = 'did:key:z6Mkgg342Ycpuk263R9d8Aq6MUaxPn1DDeHyGo38EefXmgDL'
      await this.agent.dids.import({
        did: issuerId,
        overwrite: true,
        privateKeys: [
          {
            keyType: KeyType.Ed25519,
            privateKey: TypedArrayEncoder.fromString('testseed000000000000000000000001'),
          },
        ],
      })
      const dids = await this.agent.dids.getCreatedDids()
      const linkSecretIds = await this.agent.modules.anoncreds.getLinkSecretIds()
      if (linkSecretIds.length === 0) {
        await this.agent.modules.anoncreds.createLinkSecret()
      }
      const offerOob = await this.agent.credentials.createOffer({
        protocolVersion: outOfBandOption.protocolVersion as CredentialProtocolVersionType<[]>,
        credentialFormats: outOfBandOption.credentialFormats,
        autoAcceptCredential: outOfBandOption.autoAcceptCredential,
        comment: outOfBandOption.comment
      });

      const credentialMessage = offerOob.message;

      // const proof = await this.agent.proofs.createRequest({
      //   protocolVersion: outOfBandOption.proofRequest.protocolVersion as ProofsProtocolVersionType<[]>,
      //   proofFormats: outOfBandOption.proofRequest.proofFormats,
      //   goalCode: outOfBandOption.proofRequest.goalCode,
      //   willConfirm: outOfBandOption.proofRequest.willConfirm,
      //   parentThreadId: outOfBandOption.proofRequest.parentThreadId,
      //   autoAcceptProof: outOfBandOption.proofRequest.autoAcceptProof,
      //   comment: outOfBandOption.proofRequest.comment
      // });
      console.log('credMessage::::::::', JSON.stringify(credentialMessage, null, 2));
      // const proofMessage = proof.message;
      // console.log(JSON.stringify(proof.message));
      const outOfBandRecord = await this.agent.oob.createInvitation({
        label: 'test-connection',
        handshakeProtocols: [HandshakeProtocol.Connections],
        messages: [credentialMessage],
        autoAcceptConnection: true
      })

      // console.log("createInvitation---", JSON.stringify(outOfBandRecord))
      return {
        invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
          domain: this.agent.config.endpoints[0],
        }),
        invitation: outOfBandRecord.outOfBandInvitation.toJSON({
          useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
        }),
        outOfBandRecord: outOfBandRecord.toJSON(),
      }
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }


  // @Post('/create-offer-jsonld')
  // public async createOfferJsonld(
  //   @Body() createOfferOptions: any,
  //   @Res() internalServerError: TsoaResponse<500, { message: string }>
  // ) {
  //   try {
  //     const jsonLdFormatService = new JsonLdCredentialFormatService();
  //     const { attachment, previewAttributes, format } = await jsonLdFormatService.createOffer(this.agent.context, {
  //       credentialRecord: await this.mockCredentialRecord({ connectionId: createOfferOptions.credentialRecord.connectionId }),
  //       credentialFormats: { jsonld: { credential: createOfferOptions.credentialFormats, options: createOfferOptions.options } },
  //     });
  //     return { attachment, previewAttributes, format };
  //     // const { attachment, previewAttributes, format } = await jsonLdFormatService.createOffer(this.agent.context, {
  //     //   credentialFormats: {
  //     //     jsonld: signCredentialOptions,
  //     //   },
  //     //   credentialRecord: await this.mockCredentialRecord(),
  //     // })
  //     // const inputDocAsJson: JsonCredential = {
  //     //   '@context': [CREDENTIALS_CONTEXT_V1_URL, 'https://www.w3.org/2018/credentials/examples/v1'],
  //     //   type: ['VerifiableCredential', 'UniversityDegreeCredential'],
  //     //   issuer: 'did:key:z6Mkgg342Ycpuk263R9d8Aq6MUaxPn1DDeHyGo38EefXmgDL',
  //     //   issuanceDate: '2017-10-22T12:23:48Z',
  //     //   credentialSubject: {
  //     //     degree: {
  //     //       type: 'BachelorDegree',
  //     //       name: 'Bachelor of Science and Arts',
  //     //     },
  //     //     alumniOf: 'oops',
  //     //   },
  //     // }
  //     // const signCredentialOptions: JsonLdCredentialDetailFormat = {
  //     //   credential: inputDocAsJson,
  //     //   options: {
  //     //     proofPurpose: 'assertionMethod',
  //     //     proofType: 'Ed25519Signature2018',
  //     //   },
  //     // }

  //     // const jsonld = {
  //     //   credentialFormats: {
  //     //     jsonld: signCredentialOptions,
  //     //   },
  //     //   credentialRecord: await this.mockCredentialRecord(),
  //     // }

  //     // return { attachment, previewAttributes, format };
  //   } catch (error) {
  //     return internalServerError(500, { message: `something went wrong: ${error}` })
  //   }
  // }

  // async mockCredentialRecord(
  //   {
  //     state,
  //     threadId,
  //     connectionId,
  //     tags,
  //     id,
  //     credentialAttributes,
  //   }: {
  //     state?: CredentialState
  //     tags?: CustomCredentialTags
  //     threadId?: string
  //     connectionId?: string
  //     id?: string
  //     credentialAttributes?: CredentialPreviewAttribute[]
  //   } = {}
  // ) {
  //   const credentialPreview = V2CredentialPreview.fromRecord({
  //     name: 'John',
  //     age: '99',
  //   })
  //   // const credentialRecord = new CredentialExchangeRecord({
  //   //   id,
  //   //   credentialAttributes: credentialAttributes || credentialPreview.attributes,
  //   //   state: state || CredentialState.OfferSent,
  //   //   threadId: threadId ?? 'add7e1a0-109e-4f37-9caa-cfd0fcdfe540',
  //   //   connectionId: connectionId ?? '123',
  //   //   tags,
  //   //   protocolVersion: 'v2',
  //   // })

  //   console.log("credentialRecord-----", credentialRecord)
  //   return credentialRecord
  // }

  /**
   * Initiate a new credential exchange as issuer by sending a offer credential message
   * to the connection with the specified connection id.
   *
   * @param options
   * @returns CredentialExchangeRecord
   */
  // @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  // @Post('/offer-credential')
  // public async offerCredential(
  //   @Body() options: OfferCredentialOptions,
  //   @Res() notFoundError: TsoaResponse<404, { reason: string }>,
  //   @Res() internalServerError: TsoaResponse<500, { message: string }>
  // ) {
  //   try {
  //     const credential = await this.v1CredentialProtocol.offerCredential(options)
  //     return credential.toJSON()
  //   } catch (error) {
  //     if (error instanceof RecordNotFoundError) {
  //       return notFoundError(404, {
  //         reason: `connection with connection record id "${options.connectionId}" not found.`,
  //       })
  //     }
  //     return internalServerError(500, { message: `something went wrong: ${error}` })
  //   }
  // }

  /**
   * Accept a credential offer as holder by sending an accept offer message
   * to the connection associated with the credential exchange record.
   *
   * @param credentialRecordId credential identifier
   * @param options
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/accept-offer')
  public async acceptOffer(
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredentialOfferOptions: AcceptCredentialOfferOptions
  ) {
    try {

      const linkSecretIds = await this.agent.modules.anoncreds.getLinkSecretIds()
      if (linkSecretIds.length === 0) {
        await this.agent.modules.anoncreds.createLinkSecret()
      }
      const acceptOffer = await this.agent.credentials.acceptOffer({
        credentialRecordId: acceptCredentialOfferOptions.credentialRecordId,
        credentialFormats: acceptCredentialOfferOptions.credentialFormats,
        autoAcceptCredential: acceptCredentialOfferOptions.autoAcceptCredential,
        comment: acceptCredentialOfferOptions.comment
      })
      return acceptOffer
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record id "${acceptCredentialOfferOptions.credentialRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Accept a credential request as issuer by sending an accept request message
   * to the connection associated with the credential exchange record.
   *
   * @param credentialRecordId credential identifier
   * @param options
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/accept-request')
  public async acceptRequest(
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredentialRequestOptions: AcceptCredentialRequestOptions
  ) {
    try {
      const indyCredentialFormat = new LegacyIndyCredentialFormatService();

      const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat });
      const credential = await v1CredentialProtocol.acceptRequest(this.agent.context, acceptCredentialRequestOptions)
      return credential
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record "${acceptCredentialRequestOptions.credentialRecord}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Accept a credential as holder by sending an accept credential message
   * to the connection associated with the credential exchange record.
   *
   * @param options
   * @returns CredentialExchangeRecord
   */
  @Example<CredentialExchangeRecordProps>(CredentialExchangeRecordExample)
  @Post('/accept-credential')
  public async acceptCredential(
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body() acceptCredential: AcceptCredential
  ) {
    try {
      const indyCredentialFormat = new LegacyIndyCredentialFormatService();

      const v1CredentialProtocol = new V1CredentialProtocol({ indyCredentialFormat });
      const credential = await v1CredentialProtocol.acceptCredential(this.agent.context, acceptCredential)
      return credential
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `credential with credential record id "${acceptCredential.credentialRecord}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }
}
