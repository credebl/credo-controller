import { AcceptProofRequestOptions, Agent, JsonTransformer, KeyType, RecordNotFoundError, TypedArrayEncoder, injectable } from '@aries-framework/core'
import { CreateTenantOptions, GetTenantAgentOptions, WithTenantAgentOptions } from '../types';
import { Body, Controller, Delete, Get, Post, Query, Res, Route, Tags, TsoaResponse, Path } from 'tsoa'
import { TenantAgent } from '@aries-framework/tenants/build/TenantAgent';
import axios from 'axios';
import { TenantRecord } from '@aries-framework/tenants';
import { AnonCredsApi, getUnqualifiedSchemaId, getUnqualifiedCredentialDefinitionId } from '@aries-framework/anoncreds'
import { IndySdkAnonCredsRegistry } from '@aries-framework/indy-sdk'

@Tags("Multi-Tenancy")
@Route("/multi-tenancy")
@injectable()
export class MultiTenancyController extends Controller {
    private readonly agent: Agent;

    public constructor(agent: Agent) {
        super()
        this.agent = agent;
    }

    @Post("/")
    public async createTenant(
        @Body() createTenantOptions: CreateTenantOptions,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const { config, seed } = createTenantOptions;
            const body = {
                role: 'ENDORSER',
                alias: 'Alias',
                seed
            };
            console.log("config", config);
            const tenantRecord: TenantRecord = await this.agent.modules.tenants.createTenant({ config });
            const tenantAgent: TenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId: tenantRecord.id });
            const didRegistration = await axios.post('http://test.bcovrin.vonx.io/register', body);

            if (didRegistration.data) {
                await tenantAgent.dids.import({
                    did: `did:indy:bcovrin:${didRegistration.data.did}`,
                    overwrite: true,
                    privateKeys: [
                        {
                            keyType: KeyType.Ed25519,
                            privateKey: TypedArrayEncoder.fromString(seed),
                        },
                    ],
                });
            }
            const resolveResult = await this.agent.dids.resolve(`did:indy:bcovrin:${didRegistration.data.did}`);
            let verkey;
            if (resolveResult.didDocument?.verificationMethod) {
                verkey = resolveResult.didDocument.verificationMethod[0].publicKeyBase58;
            }
            return { tenantRecord, did: `did:indy:bcovrin:${didRegistration.data.did}`, verkey };
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant not created`,
                });
            }
            return internalServerError(500, { message: `Something went wrong: ${error}` });
        }
    }


    @Get("/:tenantId")
    public async getTenantById(
        @Query("tenantId") tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent: TenantAgent = await this.agent.modules.tenants.getTenantById(tenantId);
            return tenantAgent;
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant with id: ${tenantId} not found.`,
                })
            }
            return internalServerError(500, { message: `Something went wrong: ${error}` })
        }
    }

    @Post("/tenant")
    public async getTenantAgent(
        @Body() tenantAgentOptions: GetTenantAgentOptions,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId: tenantAgentOptions.tenantId });
            console.log('tenantAgent:::::::===========', await tenantAgent.dids.getCreatedDids({}));
            return tenantAgent;
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant with id: ${tenantAgentOptions.tenantId} not found.`,
                })
            }
            return internalServerError(500, { message: `Something went wrong: ${error}` })
        }
    }

    @Delete("/:tenantId")
    public async deleteTenantById(
        @Query("tenantId") tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const deleteTenant = await this.agent.modules.tenants.deleteTenantById(tenantId);
            return JsonTransformer.toJSON(deleteTenant);
        }
        catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant with id: ${tenantId} not found.`,
                })
            }
            return internalServerError(500, { message: `Something went wrong: ${error}` });
        }
    }

    async registerSchemaWithTenant(tenantAgent: any, payload: any) {
        const { issuerId, name, version, attributes } = payload;
        const { schemaState } = await tenantAgent.modules.anoncreds.registerSchema({
            schema: {
                issuerId: issuerId,
                name: name,
                version: version,
                attrNames: attributes
            },
            options: {
                endorserMode: 'internal',
                endorserDid: issuerId,
            },
        })

        const getSchemaId = await getUnqualifiedSchemaId(schemaState.schema.issuerId, name, version);
        if (schemaState.state === 'finished') {
            const skippedString = getSchemaId.substring('did:indy:bcovrin:'.length);
            schemaState.schemaId = skippedString
        }
        return schemaState;
    }

    async getSchemaWithTenant(tenantAgent: any, schemaId: any) {
        const schema = await tenantAgent.modules.anoncreds.getSchema(schemaId);
        return schema;
    }

    async getCredentialDefinition(tenantAgent: any, credentialDefinitionId: any) {
        const credDef = await tenantAgent.modules.anoncreds.getCredentialDefinition(credentialDefinitionId);
        return credDef;
    }

    async createCredentialDefinitionWithTenant(tenantAgent: any, payload: any) {
        const { issuerId, schemaId, tag } = payload;
        const { credentialDefinitionState } = await tenantAgent.modules.anoncreds.registerCredentialDefinition({
            credentialDefinition: {
                issuerId,
                schemaId,
                tag
            },
            options: {}
        })
        const indySdkAnonCredsRegistry = new IndySdkAnonCredsRegistry()
        const schemaDetails = await indySdkAnonCredsRegistry.getSchema(tenantAgent.context, schemaId)
        const getCredentialDefinitionId = await getUnqualifiedCredentialDefinitionId(credentialDefinitionState.credentialDefinition.issuerId, `${schemaDetails.schemaMetadata.indyLedgerSeqNo}`, tag);
        if (credentialDefinitionState.state === 'finished') {
            const skippedString = getCredentialDefinitionId.substring('did:indy:bcovrin:'.length);
            credentialDefinitionState.credentialDefinitionId = skippedString
        }
        return credentialDefinitionState;
    }

    async createInvitationWithTenant(tenantAgent: any) {
        const config = {
            autoAcceptConnection: true,
        }
        const createInvitation = await tenantAgent.oob.createInvitation(config);

        return ({
            invitationUrl: createInvitation.outOfBandInvitation.toUrl({
                domain: this.agent.config.endpoints[0],
            }),
            invitation: createInvitation.outOfBandInvitation.toJSON({
                useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
            }),
            outOfBandRecord: createInvitation.toJSON(),
        });
    }

    async receiveInvitationWithTenant(tenantAgent: any, payload: any) {
        const { invitationUrl, remaining } = payload;
        const { outOfBandRecord, connectionRecord } = await tenantAgent.oob.receiveInvitationFromUrl(
            invitationUrl,
            remaining
        );
        console.log("Executed: ", outOfBandRecord.toJSON(), connectionRecord?.toJSON());

        return ({
            outOfBandRecord: outOfBandRecord.toJSON(),
            connectionRecord: connectionRecord?.toJSON(),
        });
    }

    async acceptOfferWithTenant(tenantAgent: any, payload: any) {
        const { credentialRecordId, autoAcceptCredential, comment } = payload;
        const linkSecretIds = await tenantAgent.modules.anoncreds.getLinkSecretIds();
        if (linkSecretIds.length === 0) {
            await tenantAgent.modules.anoncreds.createLinkSecret()
        }
        const acceptOffer = await tenantAgent.credentials.acceptOffer({
            credentialRecordId,
            autoAcceptCredential,
            comment
        });
        return ({ CredentialExchangeRecord: acceptOffer });
    }

    @Post("/with-tenant-agent")
    async withTenantAgent(
        @Body() withTenantAgentOptions: WithTenantAgentOptions,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        const { tenantId, method, payload } = withTenantAgentOptions;
        console.log("STARTING");

        try {
            const result = await new Promise((resolve,) => {
                this.agent.modules.tenants.withTenantAgent({ tenantId }, async (tenantAgent: TenantAgent) => {
                    switch (method) {
                        case "createInvitation":
                            const getTenantToCreateInvitation = await this.agent.modules.tenants.getTenantAgent({ tenantId: tenantId });
                            const createInvitation = await this.createInvitationWithTenant(getTenantToCreateInvitation);
                            resolve({ createInvitation });
                            break;

                        case "receiveInvitation":
                            const { invitationUrl, remaining } = payload;
                            const getTenantToReceiveInvitation = await this.agent.modules.tenants.getTenantAgent({ tenantId });
                            const receiveInvitation = await this.receiveInvitationWithTenant(getTenantToReceiveInvitation, { invitationUrl, remaining });
                            resolve({ receiveInvitation });
                            break;

                        case "getConnection":
                            const { connectionId } = payload;
                            const connection = await tenantAgent.connections.findById(connectionId);
                            resolve({ connection: connection?.toJSON() });
                            break;

                        case "registerSchema":
                            var { issuerId, name, version, attributes } = payload;
                            const getTenantToCreateSchema = await this.agent.modules.tenants.getTenantAgent({ tenantId });
                            const schema = await this.registerSchemaWithTenant(getTenantToCreateSchema, { issuerId, name, version, attributes });
                            resolve({ schema });
                            break;

                        case "getSchemaById":
                            var { schemaId } = payload;
                            const schemaById = await this.getSchemaWithTenant(tenantAgent, schemaId);
                            resolve(schemaById);
                            break;

                        case "registerCredentialDefinition":
                            var { issuerId, schemaId, tag } = payload;
                            const getTenantToCreateCredentialDefinition = await this.agent.modules.tenants.getTenantAgent({ tenantId });
                            const credentialDefinition = await this.createCredentialDefinitionWithTenant(getTenantToCreateCredentialDefinition, { issuerId, schemaId, tag });
                            resolve({ credentialDefinition });
                            break;

                        case "getCredentialDefinitionById":
                            var { credentialDefinitionId } = payload;
                            const credentialDefinitionById = await this.getCredentialDefinition(tenantAgent, credentialDefinitionId);
                            resolve(credentialDefinitionById);
                            break;

                        case "getConnections":
                            const connections = await tenantAgent.connections.getAll();
                            resolve({ connectionRecord: connections });
                            break;

                        case "getCredentials":
                            const credentials = await tenantAgent.credentials.getAll();
                            console.log(`Credentials associated with ${tenantId} are ${credentials}`);
                            resolve({ CredentialExchangeRecord: credentials });
                        case "issueCredential":
                            const offerCredential = await tenantAgent.credentials.offerCredential(payload);
                            resolve({ offerCredential });
                            break;

                        case "acceptOffer":
                            var { credentialRecordId, autoAcceptCredential, comment } = payload;
                            var getTenant = await this.agent.modules.tenants.getTenantAgent({ tenantId });
                            const acceptOffer = await this.acceptOfferWithTenant(getTenant, { credentialRecordId, autoAcceptCredential, comment })
                            console.log("Offer accepted: ", acceptOffer);
                            resolve({ acceptOffer });
                            break;

                        case "createRequestForProofPresentation":
                            const createRequest = await tenantAgent.proofs.requestProof(payload);
                            console.log("Request sent for presentation: ", createRequest);
                            resolve({ ProofExchangeRecord: createRequest.toJSON() });
                            break;

                        case "acceptRequestForProofPresentation":
                            var { proofRecordId, comment } = payload;
                            const requestedCredentials = await tenantAgent.proofs.selectCredentialsForRequest({
                                proofRecordId,
                            });
                            console.log(`Requested credentials: ${requestedCredentials}`);
                            const acceptProofRequest: AcceptProofRequestOptions = {
                                proofRecordId,
                                comment,
                                proofFormats: requestedCredentials.proofFormats,
                            }

                            const acceptRequest = await tenantAgent.proofs.acceptRequest(acceptProofRequest);
                            console.log("accept request executed");
                            console.log("Request has been accepted by sending presentation: ", acceptRequest);
                            resolve({ ProofExchangeRecord: acceptRequest.toJSON() });
                            break;

                        case "acceptPresentation":
                            const acceptPresentation = await tenantAgent.proofs.acceptPresentation(payload);
                            console.log("Presentation accepted: ", acceptPresentation);
                            resolve({ ProofExchangeRecord: acceptPresentation.toJSON() });
                            break;

                        case "getProofs":
                            const presentations = await tenantAgent.proofs.getAll();
                            resolve({ presentations });
                            break;
                    }
                });
            });
            return result;
        } catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant with id: ${tenantId} not found.`,
                });
            }
            return internalServerError(500, { message: `Something went wrong: ${error}` });
        }
    }
}
