import type { RestAgentModules } from '../../cliAgent'
import type { SchemaId } from '../examples'

import { Agent } from '@credo-ts/core'
import { injectable } from 'tsyringe'

import { EndorserMode } from '../../enums/enum'
import ErrorHandlingService from '../../errorHandlingService'
import { ENDORSER_DID_NOT_PRESENT } from '../../errorMessages'
import { BadRequestError, InternalServerError, NotFoundError } from '../../errors/errors'
import { CredentialDefinitionExample, CredentialDefinitionId } from '../examples'

import { Body, Controller, Example, Get, Path, Post, Route, Tags, Security, Response } from 'tsoa'

@Tags('Credential Definitions')
@Route('/credential-definitions')
@Security('apiKey')
@injectable()
export class CredentialDefinitionController extends Controller {
  // TODO: Currently this only works if Extensible from credo-ts is renamed to something else, since there are two references to Extensible
  private agent: Agent<RestAgentModules>
  public constructor(agent: Agent<RestAgentModules>) {
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
      const credDef = {
        issuerId,
        schemaId,
        tag,
        type: 'CL',
      }
      const credentialDefinitionPyload = {
        credentialDefinition: credDef,
        options: {
          endorserMode: '',
          endorserDid: '',
          supportRevocation: false,
        },
      }
      if (!endorse) {
        credentialDefinitionPyload.options.endorserMode = EndorserMode.Internal
        credentialDefinitionPyload.options.endorserDid = issuerId
      } else {
        if (!endorserDid) {
          throw new BadRequestError(ENDORSER_DID_NOT_PRESENT)
        }
        credentialDefinitionPyload.options.endorserMode = EndorserMode.External
        credentialDefinitionPyload.options.endorserDid = endorserDid ? endorserDid : ''
      }

      const registerCredentialDefinitionResult = await this.agent.modules.anoncreds.registerCredentialDefinition(
        credentialDefinitionPyload
      )

      if (registerCredentialDefinitionResult.credentialDefinitionState.state === 'failed') {
        throw new InternalServerError('Falied to register credef on ledger')
      }

      if (registerCredentialDefinitionResult.credentialDefinitionState.state === 'wait') {
        // The request has been accepted for processing, but the processing has not been completed.
        this.setStatus(202)
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
