import { Agent, AriesFrameworkError } from "@aries-framework/core"
import { Body, Controller, Post, Res, Route, Tags, TsoaResponse } from "tsoa"
import { injectable } from "tsyringe"
import { DidNymTransaction, EndorserTransaction, WriteTransaction } from "../types"
import { SchemaId, Version } from "../examples"
import { AnonCredsCredentialDefinition, getUnqualifiedCredentialDefinitionId, getUnqualifiedSchemaId } from "@aries-framework/anoncreds"
import { IndyVdrAnonCredsRegistry, IndyVdrDidCreateOptions } from "@aries-framework/indy-vdr"

@Tags('EndorserTransaction')
@Route('/transactions')
@injectable()
export class EndorserTransactionController extends Controller {
  private agent: Agent

  public constructor(agent: Agent) {
    super()
    this.agent = agent
  }

  @Post('/endorse')
  public async endorserTransaction(
    @Body() endorserTransaction: EndorserTransaction,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Res() forbiddenError: TsoaResponse<400, { reason: string }>
  ) {
    try {
      const signedTransaction = await this.agent.modules.indyVdr.endorseTransaction(
        endorserTransaction.transaction,
        endorserTransaction.endorserDid
      )

      return { signedTransaction };
    } catch (error) {
      if (error instanceof AriesFrameworkError) {
        if (error.message.includes('UnauthorizedClientRequest')) {
          return forbiddenError(400, {
            reason: 'this action is not allowed.',
          })
        }
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Post('/set-endorser-role')
  public async didNymTransaction(
    @Body() didNymTransaction: DidNymTransaction,
    @Res() internalServerError: TsoaResponse<500, { message: string }>
  ) {
    try {
      const didCreateSubmitResult = await this.agent.dids.create<IndyVdrDidCreateOptions>({
        did: didNymTransaction.did,
        options: {
          endorserMode: 'external',
          endorsedTransaction: {
            nymRequest: didNymTransaction.nymRequest,
          },
        }
      })

      return didCreateSubmitResult
    } catch (error) {
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  @Post('/write')
  public async writeSchemaAndCredDefOnLedger(
    @Res() forbiddenError: TsoaResponse<400, { reason: string }>,
    @Res() internalServerError: TsoaResponse<500, { message: string }>,
    @Body()
    writeTransaction: WriteTransaction
  ) {
    try {
      if (writeTransaction.schema) {

        const writeSchema = await this.submitSchemaOnLedger(writeTransaction.schema, writeTransaction.endorsedTransaction);
        return writeSchema;
      } else if (writeTransaction.credentialDefinition) {

        const writeCredDef = await this.submitCredDefOnLedger(writeTransaction.credentialDefinition, writeTransaction.endorsedTransaction);
        return writeCredDef;
      } else {

        throw new Error('Please provide valid schema or credential-def!');
      }

    } catch (error) {
      if (error instanceof AriesFrameworkError) {
        if (error.message.includes('UnauthorizedClientRequest')) {
          return forbiddenError(400, {
            reason: 'this action is not allowed.',
          })
        }
      }
      return internalServerError(500, { message: `something went wrong: ${error}` })
    }
  }

  public async submitSchemaOnLedger(
    schema: {
      issuerId: string
      name: string
      version: Version
      attributes: string[]
    },
    endorsedTransaction?: string,
  ) {
    try {

      const { issuerId, name, version, attributes } = schema;
      const { schemaState } = await this.agent.modules.anoncreds.registerSchema({
        options: {
          endorserMode: 'external',
          endorsedTransaction
        },
        schema: {
          attrNames: attributes,
          issuerId: issuerId,
          name: name,
          version: version
        },
      })

      const getSchemaUnqualifiedId = await getUnqualifiedSchemaId(schemaState.schema.issuerId, schema.name, schema.version);
      if (schemaState.state === 'finished' || schemaState.state === 'action') {
        const indyNamespace = /did:indy:([^:]+:([^:]+))/.exec(issuerId);
        let schemaId;
        if (indyNamespace) {
          schemaId = getSchemaUnqualifiedId.substring(`did:indy:${indyNamespace[1]}:`.length);
        } else {
          throw new Error('No indyNameSpace found')
        }
        schemaState.schemaId = schemaId
      }
      return schemaState;

    } catch (error) {
      return error
    }
  }

  public async submitCredDefOnLedger(
    credentialDefinition: {
      schemaId: string,
      issuerId: string,
      tag: string,
      value: unknown,
      type: string
    },
    endorsedTransaction?: string
  ) {
    try {

      const { credentialDefinitionState } = await this.agent.modules.anoncreds.registerCredentialDefinition({
        credentialDefinition,
        options: {
          endorserMode: 'external',
          endorsedTransaction: endorsedTransaction,
        },
      })

      const schemaDetails = await this.agent.modules.anoncreds.getSchema(credentialDefinition.schemaId)
      const getCredentialDefinitionId = await getUnqualifiedCredentialDefinitionId(credentialDefinitionState.credentialDefinition.issuerId, `${schemaDetails.schemaMetadata.indyLedgerSeqNo}`, credentialDefinition.tag);
      if (credentialDefinitionState.state === 'finished' || credentialDefinitionState.state === 'action') {

        const indyNamespaceMatch = /did:indy:([^:]+:([^:]+))/.exec(credentialDefinition.issuerId);
        let credDefId;
        if (indyNamespaceMatch) {
          credDefId = getCredentialDefinitionId.substring(`did:indy:${indyNamespaceMatch[1]}:`.length);
        } else {
          throw new Error('No indyNameSpace found')
        }

        credentialDefinitionState.credentialDefinitionId = credDefId;
      }
      return credentialDefinitionState;

    } catch (error) {
      return error
    }
  }
}