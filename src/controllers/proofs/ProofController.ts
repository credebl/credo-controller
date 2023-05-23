import type {
  AcceptProofPresentationOptions,
  CreateProofRequestOptions,
  IndyProofFormat,
  ProofExchangeRecordProps,
  ProposeProofOptions,
  V1ProofService,
  V2ProofService,
} from '@aries-framework/core'

import { Agent, JsonTransformer, PresentationPreview, RecordNotFoundError } from '@aries-framework/core'
import { JsonEncoder } from '@aries-framework/core/build/utils/JsonEncoder'
import { Body, Controller, Delete, Example, Get, Path, Post, Query, Res, Route, Tags, TsoaResponse } from 'tsoa'
import { injectable } from 'tsyringe'

import { ProofRecordExample, RecordId } from '../examples'
import { RequestProofOptions, RequestProofProposalOptions } from '../types'

@Tags('Proofs')
@Route('/proofs')
@injectable()
export class ProofController extends Controller {
  private agent: Agent

  public constructor(agent: Agent) {
    super()
    this.agent = agent
  }

  /**
   * Retrieve all proof records
   *
   * @param threadId
   * @returns ProofRecord[]
   */
  @Example<ProofExchangeRecordProps[]>([ProofRecordExample])
  @Get('/')
  public async getAllProofs(@Query('threadId') threadId?: string) {
    let proofs = await this.agent.proofs.getAll()

    if (threadId) proofs = proofs.filter((p) => p.threadId === threadId)

    return proofs.map((proof) => proof.toJSON())
  }

  /**
   * Retrieve proof record by proof record id
   *
   * @param proofRecordId
   * @returns ProofRecord
   */
  @Get('/:proofRecordId')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async getProofById(
    @Path('proofRecordId') proofRecordId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const proof = await this.agent.proofs.getById(proofRecordId)

      return proof.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proofRecordId "${proofRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Deletes a proof record in the proof repository.
   *
   * @param proofRecordId
   */
  @Delete('/:proofRecordId')
  public async deleteProof(
    @Path('proofRecordId') proofRecordId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      this.setStatus(204)
      await this.agent.proofs.deleteById(proofRecordId)
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proofRecordId "${proofRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Initiate a new presentation exchange as prover by sending a presentation proposal request
   * to the connection with the specified connection id.
   *
   * @param proposal
   * @returns ProofRecord
   */
  @Post('/propose-proof')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async proposeProof(
    @Body() proposal: RequestProofProposalOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    // const { attributes, predicates, connectionId, ...proposalOptions } = proposal

    try {
      // const presentationPreview = JsonTransformer.fromJSON({ attributes, predicates }, PresentationPreview)

      const proposeProof = {
        connectionId: proposal.connectionId,
        proofFormats: proposal.proofFormats,
        protocolVersion: proposal.protocolVersion,
        autoAcceptProof: proposal.autoAcceptProof,
        comment: proposal.comment,
        goalCode: proposal.goalCode,
        parentThreadId: proposal.parentThreadId,
      }

      const proof = await this.agent.proofs.proposeProof(proposeProof)

      return proof.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `connection with connectionId "${proposal.connectionId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Accept a presentation proposal as verifier by sending an accept proposal message
   * to the connection associated with the proof record.
   *
   * @param proofRecordId
   * @param proposal
   * @returns ProofRecord
   */
  @Post('/:proofRecordId/accept-proposal')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async acceptProposal(
    @Path('proofRecordId') proofRecordId: string,
    @Body()
    proposal: {
      request: { name?: string; version?: string }
      comment?: string
    },
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const proof = await this.agent.proofs.acceptProposal({
        proofRecordId,
        config: {
          name: proposal.request.name || '',
          version: proposal.request.name || '',
        },
      })

      return proof.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proofRecordId "${proofRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Creates a presentation request not bound to any proposal or existing connection
   *
   * @param request
   * @returns ProofRequestMessageResponse
   */
  @Post('/request-outofband-proof')
  // @Example<{ proofUrl: string; proofRecord: ProofExchangeRecordProps }>({
  //   proofUrl: 'https://example.com/proof-url',
  //   proofRecord: ProofRecordExample,
  // })
  public async requestProofOutOfBand(@Body() request: RequestProofOptions) {
    // const requestProofOutOfBandRequestPayload: CreateProofRequestOptions<
    //   [IndyProofFormat],
    //   [V1ProofService, V2ProofService<[IndyProofFormat]>]
    // > = {
    //   protocolVersion: request.protocolVersion,
    //   proofFormats: request.proofFormats,
    //   comment: request.comment,
    //   autoAcceptProof: request.autoAcceptProof,
    //   parentThreadId: request.parentThreadId,
    // }
    const { connectionId, proofRequestOptions, ...config } = request

    const proof = await this.agent.proofs.createRequest({
      protocolVersion: 'v1',
      comment: request.comment,
      proofFormats: {
        indy: {
          name: 'proof-request',
          version: '1.0',
          nonce: await this.agent.wallet.generateNonce(),
          requestedAttributes: proofRequestOptions.requestedAttributes,
          requestedPredicates: proofRequestOptions.requestedPredicates,
        },
      },
      autoAcceptProof: request.autoAcceptProof,
    })

    return {
      proofUrl: `${this.agent.config.endpoints[0]}/?d_m=${JsonEncoder.toBase64URL(
        proof.message.toJSON({ useLegacyDidSovPrefix: this.agent.config.useLegacyDidSovPrefix })
      )}`,
      proofRecord: proof.proofRecord,
    }
  }

  /**
   * Creates a presentation request bound to existing connection
   *
   * @param request
   * @returns ProofRecord
   */
  // @Post('/request-proof')
  // // @Example<ProofExchangeRecordProps>(ProofRecordExample)
  // public async requestProof(
  //   @Body() request: RequestProofOptions,
  //   @Res() notFoundError: TsoaResponse<404, { reason: string }>,
  //   @Res() internalServerError: TsoaResponse<500, { message: string }>
  // ) {
  //   // const { connectionId, proofRequestOptions, ...config } = request

  //   try {
  //     const requestProofPayload: RequestProofOptions = {
  //       protocolVersion: request.protocolVersion,
  //       proofFormats: request.proofFormats,
  //       comment: request.comment,
  //       autoAcceptProof: request.autoAcceptProof,
  //       parentThreadId: request.parentThreadId,
  //       connectionId: request.connectionId,
  //     }
  //     const proof = await this.agent.proofs.requestProof(requestProofPayload)

  //     return proof.toJSON()
  //   } catch (error) {
  //     if (error instanceof RecordNotFoundError) {
  //       return notFoundError(404, {
  //         reason: `connection with connectionId "${request.connectionId}" not found.`,
  //       })
  //     }
  //     return internalServerError(500, { message: `something went wrong: ${error}` })
  //   }
  // }

  @Post('/request-proof')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async requestProof(
    @Body() request: RequestProofOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    const { connectionId, proofRequestOptions, ...config } = request

    try {
      const proof = await this.agent.proofs.requestProof({
        connectionId,
        protocolVersion: 'v1',
        comment: request.comment,
        proofFormats: {
          indy: {
            name: 'proof-request',
            version: '1.0',
            nonce: await this.agent.wallet.generateNonce(),
            requestedAttributes: proofRequestOptions.requestedAttributes,
            requestedPredicates: proofRequestOptions.requestedPredicates,
          },
        },
        autoAcceptProof: request.autoAcceptProof,
      })

      return proof.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `connection with connectionId "${connectionId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Accept a presentation request as prover by sending an accept request message
   * to the connection associated with the proof record.
   *
   * @param proofRecordId
   * @param request
   * @returns ProofRecord
   */
  @Post('/:proofRecordId/accept-request')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async acceptRequest(
    @Path('proofRecordId') proofRecordId: string,
    @Body()
    request: {
      filterByPresentationPreview?: boolean
      filterByNonRevocationRequirements?: boolean
      comment?: string
    },
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const { filterByPresentationPreview, filterByNonRevocationRequirements, comment } = request

      // const retrievedCredentials = await this.agent.proofs.getRequestedCredentialsForProofRequest({
      //   proofRecordId,
      //   config: {
      //     filterByNonRevocationRequirements,
      //     filterByPresentationPreview,
      //   },
      // })

      const requestedCredentials = this.agent.proofs.autoSelectCredentialsForProofRequest({
        proofRecordId,
        config: {
          filterByNonRevocationRequirements,
          filterByPresentationPreview,
        },
      })

      const acceptProofRequest: AcceptProofPresentationOptions = {
        proofRecordId,
        comment,
        proofFormats: (await requestedCredentials).proofFormats,
      }
      const proof = await this.agent.proofs.acceptRequest(acceptProofRequest)

      return proof.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proofRecordId "${proofRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  /**
   * Accept a presentation as prover by sending an accept presentation message
   * to the connection associated with the proof record.
   *
   * @param proofRecordId
   * @returns ProofRecord
   */
  @Post('/:proofRecordId/accept-presentation')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async acceptPresentation(
    @Path('proofRecordId') proofRecordId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const proof = await this.agent.proofs.acceptPresentation(proofRecordId)

      return proof.toJSON()
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proofRecordId "${proofRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }
}
