import type {
  AcceptProofRequestOptions,
  ProofExchangeRecordProps,
  ProofsProtocolVersionType,
  Routing,
} from '@aries-framework/core'

// eslint-disable-next-line import/no-extraneous-dependencies
import { HandshakeProtocol, Key, KeyType, RecordNotFoundError } from '@aries-framework/core'
import { Request as Req } from 'express'
// eslint-disable-next-line import/no-extraneous-dependencies
import { injectable } from 'tsyringe'

import { ProofRecordExample, RecordId } from '../examples'
import {
  AcceptProofProposal,
  CreateProofRequestOobOptions,
  RequestProofOptions,
  RequestProofProposalOptions,
} from '../types'

import {
  Body,
  Controller,
  Example,
  Get,
  Path,
  Post,
  Query,
  Res,
  Route,
  Tags,
  TsoaResponse,
  Security,
  Request,
} from 'tsoa'

@Tags('Proofs')
@Route('/proofs')
// @Security('apiKey')
@Security('jwt')
@injectable()
export class ProofController extends Controller {
  /**
   * Retrieve all proof records
   *
   * @param threadId
   * @returns ProofRecord[]
   */
  @Example<ProofExchangeRecordProps[]>([ProofRecordExample])
  @Get('/')
  public async getAllProofs(@Request() request: Req, @Query('threadId') threadId?: string) {
    let proofs = await request.agent.proofs.getAll()

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
    @Request() request: Req,
    @Path('proofRecordId') proofRecordId: RecordId,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const proof = await request.agent.proofs.getById(proofRecordId)

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
   * Initiate a new presentation exchange as prover by sending a presentation proposal request
   * to the connection with the specified connection id.
   *
   * @param proposal
   * @returns ProofRecord
   */
  @Post('/propose-proof')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async proposeProof(
    @Request() request: Req,
    @Body() requestProofProposalOptions: RequestProofProposalOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const proof = await request.agent.proofs.proposeProof({
        connectionId: requestProofProposalOptions.connectionId,
        protocolVersion: 'v1' as ProofsProtocolVersionType<[]>,
        proofFormats: requestProofProposalOptions.proofFormats,
        comment: requestProofProposalOptions.comment,
        autoAcceptProof: requestProofProposalOptions.autoAcceptProof,
        goalCode: requestProofProposalOptions.goalCode,
        parentThreadId: requestProofProposalOptions.parentThreadId,
      })

      return proof
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `connection with connection id "${requestProofProposalOptions.connectionId}" not found.`,
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
    @Request() request: Req,
    @Body() acceptProposal: AcceptProofProposal,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const proof = await request.agent.proofs.acceptProposal(acceptProposal)

      return proof
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proof record  "${acceptProposal.proofRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Post('/request-proof')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async requestProof(
    @Request() request: Req,
    @Body() requestProofOptions: RequestProofOptions,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const requestProofPayload = {
        connectionId: requestProofOptions.connectionId,
        protocolVersion: requestProofOptions.protocolVersion as ProofsProtocolVersionType<[]>,
        comment: requestProofOptions.comment,
        proofFormats: requestProofOptions.proofFormats,
        autoAcceptProof: requestProofOptions.autoAcceptProof,
        goalCode: requestProofOptions.goalCode,
        parentThreadId: requestProofOptions.parentThreadId,
        willConfirm: requestProofOptions.willConfirm,
      }
      const proof = await request.agent.proofs.requestProof(requestProofPayload)

      return proof
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Post('create-request-oob')
  public async createRequest(
    @Request() request: Req,
    @Body() createRequestOptions: CreateProofRequestOobOptions,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      let routing: Routing
      if (createRequestOptions?.recipientKey) {
        routing = {
          endpoints: request.agent.config.endpoints,
          routingKeys: [],
          recipientKey: Key.fromPublicKeyBase58(createRequestOptions.recipientKey, KeyType.Ed25519),
          mediatorId: undefined,
        }
      } else {
        routing = await request.agent.mediationRecipient.getRouting({})
      }
      const proof = await request.agent.proofs.createRequest({
        protocolVersion: createRequestOptions.protocolVersion as ProofsProtocolVersionType<[]>,
        proofFormats: createRequestOptions.proofFormats,
        goalCode: createRequestOptions.goalCode,
        willConfirm: createRequestOptions.willConfirm,
        parentThreadId: createRequestOptions.parentThreadId,
        autoAcceptProof: createRequestOptions.autoAcceptProof,
        comment: createRequestOptions.comment,
      })
      const proofMessage = proof.message
      const outOfBandRecord = await request.agent.oob.createInvitation({
        label: createRequestOptions.label,
        handshakeProtocols: [HandshakeProtocol.Connections],
        messages: [proofMessage],
        autoAcceptConnection: true,
        imageUrl: createRequestOptions?.imageUrl,
        routing,
      })

      return {
        invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
          domain: request.agent.config.endpoints[0],
        }),
        invitation: outOfBandRecord.outOfBandInvitation.toJSON({
          useDidSovPrefixWhereAllowed: request.agent.config.useDidSovPrefixWhereAllowed,
        }),
        outOfBandRecord: outOfBandRecord.toJSON(),
        recipientKey: createRequestOptions?.recipientKey ? {} : { recipientKey: routing.recipientKey.publicKeyBase58 },
      }
    } catch (error) {
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
    @Request() request: Req,
    @Path('proofRecordId') proofRecordId: string,
    @Body()
    requestBody: {
      filterByPresentationPreview?: boolean
      filterByNonRevocationRequirements?: boolean
      comment?: string
    },
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const requestedCredentials = await request.agent.proofs.selectCredentialsForRequest({
        proofRecordId,
      })

      const acceptProofRequest: AcceptProofRequestOptions = {
        proofRecordId,
        comment: requestBody.comment,
        proofFormats: requestedCredentials.proofFormats,
      }

      const proof = await request.agent.proofs.acceptRequest(acceptProofRequest)

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
    @Request() request: Req,
    @Path('proofRecordId') proofRecordId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const proof = await request.agent.proofs.acceptPresentation({ proofRecordId })
      return proof
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return notFoundError(404, {
          reason: `proof with proofRecordId "${proofRecordId}" not found.`,
        })
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Get('/:proofRecordId/form-data')
  @Example<ProofExchangeRecordProps>(ProofRecordExample)
  public async proofFormData(
    @Request() request: Req,
    @Path('proofRecordId') proofRecordId: string,
    @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const proof = await request.agent.proofs.getFormatData(proofRecordId)
      return proof
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
