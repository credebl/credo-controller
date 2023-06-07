import type {
  // AcceptProofPresentationOptions,
  AcceptProofRequestOptions,
  CreateProofRequestOptions,
  // IndyProofFormat,
  ProofExchangeRecordProps,
  // ProposeProofOptions,
  // V1ProofService,
  // V2ProofService,
} from '@aries-framework/core'

import type {
  V1ProofProtocol
} from '@aries-framework/anoncreds'

import { Agent, RecordNotFoundError } from '@aries-framework/core'
import { Body, Controller, Delete, Example, Get, Path, Post, Query, Res, Route, Tags, TsoaResponse } from 'tsoa'
import { injectable } from 'tsyringe'

import { ProofRecordExample, RecordId } from '../examples'
import { AcceptProofProposal, RequestProofOptions, RequestProofProposalOptions } from '../types'

@Tags('Proofs')
@Route('/proofs')
@injectable()
export class ProofController extends Controller {
  private agent: Agent
  private v1ProofProtocol: V1ProofProtocol
  public constructor(agent: Agent, v1ProofProtocol: V1ProofProtocol) {
    super()
    this.agent = agent
    this.v1ProofProtocol = v1ProofProtocol
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
    let proofs = await this.v1ProofProtocol.getAll(this.agent.context)

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
      const proof = await this.v1ProofProtocol.getById(this.agent.context, proofRecordId)

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
  // @Delete('/:proofRecordId')
  // public async deleteProof(
  //   @Path('proofRecordId') proofRecordId: RecordId,
  //   @Res() notFoundError: TsoaResponse<404, { reason: string }>,
  //   @Res() internalServerError: TsoaResponse<500, { message: string }>
  // ) {
  //   try {
  //     this.setStatus(204)
  //     await this.v1ProofProtocol.delete(proofRecordId)
  //   } catch (error) {
  //     if (error instanceof RecordNotFoundError) {
  //       return notFoundError(404, {
  //         reason: `proof with proofRecordId "${proofRecordId}" not found.`,
  //       })
  //     }
  //     return internalServerError(500, { message: `something went wrong: ${error}` })
  //   }
  // }

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
        connectionRecord: proposal.connectionRecord,
        proofFormats: proposal.proofFormats,
        protocolVersion: proposal.protocolVersion,
        autoAcceptProof: proposal.autoAcceptProof,
        comment: proposal.comment,
        goalCode: proposal.goalCode,
        parentThreadId: proposal.parentThreadId,
      }

      const proof = await this.v1ProofProtocol.createProposal(this.agent.context, proposeProof)

      return proof
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `connection with connection record "${proposal.connectionRecord}" not found.`,
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
    @Body() acceptProposal: AcceptProofProposal,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const proof = await this.v1ProofProtocol.acceptProposal(this.agent.context, acceptProposal)

      return proof;
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proof record  "${acceptProposal.proofRecord}" not found.`,
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
  // @Post('/request-outofband-proof')
  // // @Example<{ proofUrl: string; proofRecord: ProofExchangeRecordProps }>({
  // //   proofUrl: 'https://example.com/proof-url',
  // //   proofRecord: ProofRecordExample,
  // // })
  // public async requestProofOutOfBand(@Body() request: RequestProofOptions) {
  //   // const requestProofOutOfBandRequestPayload: CreateProofRequestOptions<
  //   //   [IndyProofFormat],
  //   //   [V1ProofService, V2ProofService<[IndyProofFormat]>]
  //   // > = {
  //   //   protocolVersion: request.protocolVersion,
  //   //   proofFormats: request.proofFormats,
  //   //   comment: request.comment,
  //   //   autoAcceptProof: request.autoAcceptProof,
  //   //   parentThreadId: request.parentThreadId,
  //   // }
  //   const { connectionId, proofRequestOptions, ...config } = request

  //   const proof = await this.agent.proofs.createRequest({
  //     protocolVersion: config.protocolVersion,
  //     comment: config.comment,
  //     proofFormats: {
  //       indy: {
  //         name: 'proof-request',
  //         version: '1.0',
  //         nonce: await this.agent.wallet.generateNonce(),
  //         requestedAttributes: proofRequestOptions.requestedAttributes,
  //         requestedPredicates: proofRequestOptions.requestedPredicates,
  //       },
  //     },
  //     autoAcceptProof: request.autoAcceptProof,
  //   })

  //   return {
  //     proofUrl: `${this.agent.config.endpoints[0]}/?d_m=${JsonEncoder.toBase64URL(
  //       proof.message.toJSON({ useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed })
  //     )}`,
  //     proofRecord: proof.proofRecord,
  //   }
  // }

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

      const proof = await this.v1ProofProtocol.createRequest(this.agent.context, {
        connectionRecord: config.connectionRecord,
        comment: config.comment,
        proofFormats: config.proofFormats
      })

      return proof
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

      const requestedCredentials = this.agent.proofs.selectCredentialsForRequest({
        proofRecordId,
        proofFormats: {
          filterByNonRevocationRequirements,
          filterByPresentationPreview,
        },
      })

      const acceptProofRequest: AcceptProofRequestOptions = {
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
      const proof = await this.agent.proofs.acceptPresentation({ proofRecordId })

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
