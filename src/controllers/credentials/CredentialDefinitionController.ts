import type { SchemaId } from '../examples'

import { Agent } from '@credo-ts/core'
import { injectable } from 'tsyringe'

import ErrorHandlingService from '../../errorHandlingService'
import { BadRequestError, InternalServerError, NotFoundError } from '../../errors/errors'
import { CredentialDefinitionExample, CredentialDefinitionId } from '../examples'

import { Body, Controller, Example, Get, Path, Post, Route, Tags, Security, Response } from 'tsoa'

@Tags('Credential Definitions')
@Route('/credential-definitions')
@Security('apiKey')
@injectable()
export class CredentialDefinitionController extends Controller {
  private agent: Agent
  public constructor(agent: Agent) {
    super()
    this.agent = agent
  }

  /**
   * Retrieve credential definition by credential definition id
   *
   * @param credentialDefinitionId
   * @returns CredDef
   */
  @Example(CredentialDefinitionExample)
  @Get('/:credentialDefinitionId')
  public async getCredentialDefinitionById(
    @Path('credentialDefinitionId') credentialDefinitionId: CredentialDefinitionId
  ) {
    try {
      const credentialDefinitionResult = await this.agent.modules.anoncreds.getCredentialDefinition(
        credentialDefinitionId
      )

      if (credentialDefinitionResult.resolutionMetadata?.error === 'notFound') {
        throw new NotFoundError(credentialDefinitionResult.resolutionMetadata.message)
      }
      const error = credentialDefinitionResult.resolutionMetadata?.error

      if (error === 'invalid' || error === 'unsupportedAnonCredsMethod') {
        throw new BadRequestError(credentialDefinitionResult.resolutionMetadata.message)
      }

      if (error !== undefined || credentialDefinitionResult.credentialDefinition === undefined) {
        throw new InternalServerError(credentialDefinitionResult.resolutionMetadata.message)
      }

      return credentialDefinitionResult
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }

  /**
   * Creates a new credential definition.
   *
   * @param credentialDefinitionRequest
   * @returns CredDef
   */
  @Example(CredentialDefinitionExample)
  @Response(200, 'Action required')
  @Response(202, 'Wait for action to complete')
  @Post('/')
  public async createCredentialDefinition(
    @Body()
    credentialDefinitionRequest: {
      issuerId: string
      schemaId: SchemaId
      tag: string
      endorse?: boolean
      endorserDid?: string
    }
  ) {
    try {
      const { issuerId, schemaId, tag, endorse, endorserDid } = credentialDefinitionRequest
      const credentialDefinitionPyload = {
        issuerId,
        schemaId,
        tag,
        type: 'CL',
      }
      let registerCredentialDefinitionResult
      if (!endorse) {
        registerCredentialDefinitionResult = await this.agent.modules.anoncreds.registerCredentialDefinition({
          credentialDefinition: credentialDefinitionPyload,
          options: {},
        })
      } else {
        if (!endorserDid) {
          throw new BadRequestError('Please provide the endorser DID')
        }

        registerCredentialDefinitionResult = await this.agent.modules.anoncreds.registerCredentialDefinition({
          credentialDefinition: credentialDefinitionPyload,
          options: {
            endorserMode: 'external',
            endorserDid: endorserDid ? endorserDid : '',
          },
        })
      }

      if (registerCredentialDefinitionResult.credentialDefinitionState.state === 'failed') {
        throw new InternalServerError('Falied to register credef on ledger')
      }

      if (registerCredentialDefinitionResult.credentialDefinitionState.state === 'wait') {
        // The request has been accepted for processing, but the processing has not been completed.
        return {
          ...registerCredentialDefinitionResult,
          credentialDefinitionState: registerCredentialDefinitionResult.credentialDefinitionState,
        }
      }

      if (registerCredentialDefinitionResult.credentialDefinitionState.state === 'action') {
        return {
          ...registerCredentialDefinitionResult,
          credentialDefinitionState: registerCredentialDefinitionResult.credentialDefinitionState,
        }
      }

      return {
        ...registerCredentialDefinitionResult,
        credentialDefinitionState: registerCredentialDefinitionResult.credentialDefinitionState,
      }
    } catch (error) {
      throw ErrorHandlingService.handle(error)
    }
  }
}
