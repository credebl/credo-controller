import { AcceptCredentialOfferOptions, AcceptProofRequestOptions, Agent, AriesFrameworkError, Buffer, ConnectionRecordProps, ConnectionRepository, CreateOutOfBandInvitationConfig, CredentialProtocolVersionType, CredentialRepository, CredentialState, DidDocumentBuilder, DidExchangeState, HandshakeProtocol, JsonTransformer, KeyDidCreateOptions, KeyType, OutOfBandInvitation, ProofExchangeRecordProps, ProofsProtocolVersionType, RecordNotFoundError, TypedArrayEncoder, getEd25519VerificationKey2018, injectable } from '@aries-framework/core'
import { CreateOfferOobOptions, CreateOfferOptions, CreateProofRequestOobOptions, CreateTenantOptions, GetTenantAgentOptions, ReceiveInvitationByUrlProps, ReceiveInvitationProps, WithTenantAgentOptions } from '../types';
import { Body, Controller, Delete, Get, Post, Query, Res, Route, Tags, TsoaResponse, Path, Example } from 'tsoa'
import axios from 'axios';
import { TenantRecord } from '@aries-framework/tenants';
import { getUnqualifiedSchemaId, getUnqualifiedCredentialDefinitionId } from '@aries-framework/anoncreds'
import { Version, SchemaId, CredentialDefinitionId, RecordId, ProofRecordExample, ConnectionRecordExample } from '../examples';
import { IndyVdrAnonCredsRegistry } from '@aries-framework/indy-vdr'
import { AnonCredsError } from '@aries-framework/anoncreds'
import { RequestProofOptions } from '../types';
import { TenantAgent } from '@aries-framework/tenants/build/TenantAgent';
import { BCOVRIN_REGISTER_URL, INDICIO_NYM_URL } from '../../utils/util'

@Tags("MultiTenancy")
@Route("/multi-tenancy")
@injectable()
export class MultiTenancyController extends Controller {
    private readonly agent: Agent;

    public constructor(agent: Agent) {
        super()
        this.agent = agent;
    }


    @Post("/create-tenant")
    public async createTenant(
        @Body() createTenantOptions: CreateTenantOptions,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const { config, seed } = createTenantOptions;
            const tenantRecord: TenantRecord = await this.agent.modules.tenants.createTenant({ config });
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId: tenantRecord.id });

            createTenantOptions.method = createTenantOptions.method || 'bcovrin:testnet';
            const didMethod = `did:indy:${createTenantOptions.method}`;

            if (createTenantOptions.method.includes('bcovrin')) {
                const body = {
                    role: 'ENDORSER',
                    alias: 'Alias',
                    seed
                };

                const res = await axios.post(BCOVRIN_REGISTER_URL, body);

                if (res) {
                    const { did } = res?.data;
                    await this.importDid(didMethod, did, createTenantOptions.seed, tenantAgent);
                }

                const resolveResult = await this.agent.dids.resolve(`${didMethod}:${res.data.did}`);
                let verkey;
                if (resolveResult.didDocument?.verificationMethod) {
                    verkey = resolveResult.didDocument.verificationMethod[0].publicKeyBase58;
                }
                return { tenantRecord, did: `${didMethod}:${res.data.did}`, verkey };

            } else if (createTenantOptions.method.includes('indicio')) {

                const key = await this.agent.wallet.createKey({
                    privateKey: TypedArrayEncoder.fromString(createTenantOptions.seed),
                    keyType: KeyType.Ed25519
                });

                const buffer = TypedArrayEncoder.fromBase58(key.publicKeyBase58);
                const did = TypedArrayEncoder.toBase58(buffer.slice(0, 16));

                const body = {
                    network: 'testnet',
                    did,
                    verkey: TypedArrayEncoder.toBase58(buffer)
                };

                const res = await axios.post(INDICIO_NYM_URL, body);

                if (res.data.statusCode === 200) {
                    await this.importDid(didMethod, body.did, createTenantOptions.seed, tenantAgent);
                    const resolveResult = await this.agent.dids.resolve(`${didMethod}:${body.did}`);
                    let verkey;
                    if (resolveResult.didDocument?.verificationMethod) {
                        verkey = resolveResult.didDocument.verificationMethod[0].publicKeyBase58;
                    }
                    return { tenantRecord, did: `${didMethod}:${body.did}`, verkey };
                }
            } else if ('key' === createTenantOptions.method) {

                const did = await this.agent.dids.create<KeyDidCreateOptions>({
                    method: 'key',
                    options: {
                        keyType: KeyType.Ed25519,
                    },
                    secret: {
                        privateKey: TypedArrayEncoder.fromString(seed)
                    }
                });
                await this.agent.dids.import({
                    did: `${did.didState.did}`,
                    overwrite: true,
                    privateKeys: [
                        {
                            keyType: KeyType.Ed25519,
                            privateKey: TypedArrayEncoder.fromString(seed)
                        },
                    ],
                });
                const resolveResult = await this.agent.dids.resolve(`did:key:${did}`);
                let verkey;
                if (resolveResult.didDocument?.verificationMethod) {
                    verkey = resolveResult.didDocument.verificationMethod[0].publicKeyBase58;
                }
                return { tenantRecord, did, verkey };

            } else if ('web' === createTenantOptions.method) {

                const domain = 'credebl.github.io';
                const did = `did:web:${domain}`;
                const keyId = `${did}#key-1`;

                const key = await this.agent.wallet.createKey({
                    keyType: KeyType.Ed25519,
                    privateKey: TypedArrayEncoder.fromString(seed)
                });

                const didDocument = new DidDocumentBuilder(did)
                    .addContext('https://w3id.org/security/suites/ed25519-2018/v1')
                    .addVerificationMethod(getEd25519VerificationKey2018({ key, id: keyId, controller: did }))
                    .addAuthentication(keyId)
                    .build();

                await this.agent.dids.import({
                    did,
                    overwrite: true,
                    didDocument
                });

                const resolveResult = await this.agent.dids.resolve(did);
                let verkey;
                if (resolveResult.didDocument?.verificationMethod) {
                    verkey = resolveResult.didDocument.verificationMethod[0].publicKeyBase58;
                }
                return { tenantRecord, did, verkey };
            }
        } catch (error) {
            if (error instanceof RecordNotFoundError) {
                return notFoundError(404, {
                    reason: `Tenant not created`,
                });
            }
            return internalServerError(500, { message: `Something went wrong: ${error}` });
        }
    }

    private async importDid(didMethod: string, did: string, seed: string, tenantAgent: { dids: { import: (arg0: { did: string; overwrite: boolean; privateKeys: { keyType: KeyType; privateKey: Buffer; }[]; }) => any; }; }) {
        await tenantAgent.dids.import({
            did: `${didMethod}:${did}`,
            overwrite: true,
            privateKeys: [
                {
                    keyType: KeyType.Ed25519,
                    privateKey: TypedArrayEncoder.fromString(seed)
                }
            ]
        });
    }

    @Example<ConnectionRecordProps>(ConnectionRecordExample)
    @Get('/connections/:connectionId/:tenantId')
    public async getConnectionById(
        @Path("tenantId") tenantId: string,
        @Path('connectionId') connectionId: RecordId,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>
    ) {
        const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
        const connection = await tenantAgent.connections.findById(connectionId)

        if (!connection) return notFoundError(404, { reason: `connection with connection id "${connectionId}" not found.` })

        return connection.toJSON()
    }


    @Post('/create-invitation/:tenantId')
    public async createInvitation(
        @Res() internalServerError: TsoaResponse<500, { message: string }>,
        @Path("tenantId") tenantId: string,
        @Body() config?: Omit<CreateOutOfBandInvitationConfig, 'routing' | 'appendedAttachments' | 'messages'> // props removed because of issues with serialization
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const outOfBandRecord = await tenantAgent.oob.createInvitation(config);
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

    @Post('/create-legacy-invitation/:tenantId')
    public async createLegacyInvitation(
        @Res() internalServerError: TsoaResponse<500, { message: string }>,
        @Path("tenantId") tenantId: string,
        @Body() config?: Omit<CreateOutOfBandInvitationConfig, 'routing' | 'appendedAttachments' | 'messages'> // props removed because of issues with serialization
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const { outOfBandRecord, invitation } = await tenantAgent.oob.createLegacyInvitation(config)

            return {
                invitationUrl: invitation.toUrl({
                    domain: this.agent.config.endpoints[0],
                    useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
                }),
                invitation: invitation.toJSON({
                    useDidSovPrefixWhereAllowed: this.agent.config.useDidSovPrefixWhereAllowed,
                }),
                outOfBandRecord: outOfBandRecord.toJSON(),
            }
        } catch (error) {
            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    @Post('/receive-invitation/:tenantId')
    public async receiveInvitation(
        @Body() invitationRequest: ReceiveInvitationProps,
        @Path("tenantId") tenantId: string,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const { invitation, ...config } = invitationRequest
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const invite = new OutOfBandInvitation({ ...invitation, handshakeProtocols: invitation.handshake_protocols })
            const { outOfBandRecord, connectionRecord } = await tenantAgent.oob.receiveInvitation(invite, config)
            return {
                outOfBandRecord: outOfBandRecord.toJSON(),
                connectionRecord: connectionRecord?.toJSON(),
            }
        } catch (error) {
            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    @Post('/receive-invitation-url/:tenantId')
    public async receiveInvitationFromUrl(
        @Body() invitationRequest: ReceiveInvitationByUrlProps,
        @Path("tenantId") tenantId: string,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const { invitationUrl, ...config } = invitationRequest
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            console.log('tenantid', tenantId);
            const { outOfBandRecord, connectionRecord } = await tenantAgent.oob.receiveInvitationFromUrl(invitationUrl, config)
            return {
                outOfBandRecord: outOfBandRecord.toJSON(),
                connectionRecord: connectionRecord?.toJSON(),
            }
        } catch (error) {
            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    @Get('/oob/:invitationId/:tenantId')
    public async getAllOutOfBandRecords(
        @Path('tenantId') tenantId: string,
        @Path('invitationId') invitationId?: string,
    ) {
        const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });

        let outOfBandRecords = await tenantAgent.oob.getAll()

        if (invitationId) outOfBandRecords = outOfBandRecords.filter((o: any) => o.outOfBandInvitation.id === invitationId)

        return outOfBandRecords.map((c: any) => c.toJSON())
    }

    @Get('/connections/:tenantId')
    public async getAllConnections(
        @Path('tenantId') tenantId: string,
        @Query('outOfBandId') outOfBandId?: string,
        @Query('alias') alias?: string,
        @Query('state') state?: DidExchangeState,
        @Query('myDid') myDid?: string,
        @Query('theirDid') theirDid?: string,
        @Query('theirLabel') theirLabel?: string
    ) {
        let connections
        const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
        if (outOfBandId) {
            connections = await tenantAgent.connections.findAllByOutOfBandId(outOfBandId)
        } else {
            const connectionRepository = tenantAgent.dependencyManager.resolve(ConnectionRepository)

            const connections = await connectionRepository.findByQuery(tenantAgent.context, {
                alias,
                myDid,
                theirDid,
                theirLabel,
                state,
            })

            return connections.map((c: any) => c.toJSON())
        }
    }

    @Get('/url/:tenantId/:invitationId')
    public async getInvitation(
        @Path('invitationId') invitationId: string,
        @Path('tenantId') tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
    ) {
        const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
        const outOfBandRecord = await tenantAgent.oob.findByCreatedInvitationId(invitationId)

        if (!outOfBandRecord || outOfBandRecord.state !== 'await-response')
            return notFoundError(404, { reason: `connection with invitationId "${invitationId}" not found.` })

        const invitationJson = outOfBandRecord.outOfBandInvitation.toJSON({ useDidSovPrefixWhereAllowed: true })
        return invitationJson;
    }

    @Post('/schema/:tenantId')
    public async createSchema(
        @Body()
        schema: {
            issuerId: string
            name: string
            version: Version
            attributes: string[]
        },
        @Path("tenantId") tenantId: string,
        @Res() forbiddenError: TsoaResponse<400, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const { schemaState } = await tenantAgent.modules.anoncreds.registerSchema({
                schema: {
                    issuerId: schema.issuerId,
                    name: schema.name,
                    version: schema.version,
                    attrNames: schema.attributes
                },
                options: {
                    endorserMode: 'internal',
                    endorserDid: schema.issuerId,
                },
            })
            const getSchemaId = await getUnqualifiedSchemaId(schemaState.schema.issuerId, schema.name, schema.version);
            if (schemaState.state === 'finished') {

                const indyNamespace = schema.issuerId.match(/did:indy:([^:]+:?(mainnet|testnet)?:?)/);
                let schemaId;

                if (indyNamespace) {
                    schemaId = getSchemaId.substring(`did:indy:${indyNamespace[1]}`.length);
                } else {
                    throw new Error('No indyNameSpace found')
                }

                schemaState.schemaId = schemaId
            }
            return schemaState;
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

    @Get('/schema/:schemaId/:tenantId')
    public async getSchemaById(
        @Path('schemaId') schemaId: SchemaId,
        @Path('tenantId') tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() forbiddenError: TsoaResponse<403, { reason: string }>,
        @Res() badRequestError: TsoaResponse<400, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            return await tenantAgent.modules.anoncreds.getSchema(schemaId)
        } catch (error) {
            if (error instanceof AnonCredsError && error.message === 'IndyError(LedgerNotFound): LedgerNotFound') {
                return notFoundError(404, {
                    reason: `schema definition with schemaId "${schemaId}" not found.`,
                })
            } else if (error instanceof AnonCredsError && error.cause instanceof AnonCredsError) {
                if (error.cause.cause, 'LedgerInvalidTransaction') {
                    return forbiddenError(403, {
                        reason: `schema definition with schemaId "${schemaId}" can not be returned.`,
                    })
                }
                if (error.cause.cause, 'CommonInvalidStructure') {
                    return badRequestError(400, {
                        reason: `schemaId "${schemaId}" has invalid structure.`,
                    })
                }
            }

            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    @Post('/credential-definition/:tenantId')
    public async createCredentialDefinition(
        @Body()
        credentialDefinitionRequest: {
            issuerId: string
            schemaId: string
            tag: string
        },
        @Path('tenantId') tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const { credentialDefinitionState } = await tenantAgent.modules.anoncreds.registerCredentialDefinition({
                credentialDefinition: {
                    issuerId: credentialDefinitionRequest.issuerId,
                    schemaId: credentialDefinitionRequest.schemaId,
                    tag: credentialDefinitionRequest.tag
                },
                options: {}
            })
            const indyVdrAnonCredsRegistry = new IndyVdrAnonCredsRegistry()
            const schemaDetails = await indyVdrAnonCredsRegistry.getSchema(tenantAgent.context, credentialDefinitionRequest.schemaId)
            if (!credentialDefinitionState?.credentialDefinition) {
                throw new Error('')
            }
            const getCredentialDefinitionId = await getUnqualifiedCredentialDefinitionId(credentialDefinitionState.credentialDefinition.issuerId, `${schemaDetails.schemaMetadata.indyLedgerSeqNo}`, credentialDefinitionRequest.tag);
            if (credentialDefinitionState.state === 'finished') {

                const indyNamespace = credentialDefinitionRequest.issuerId.match(/did:indy:([^:]+:?(mainnet|testnet)?:?)/);
                let credDefId;
                if (indyNamespace) {
                  credDefId = getCredentialDefinitionId.substring(`did:indy:${indyNamespace[1]}`.length);
                } else {
                  throw new Error('No indyNameSpace found')
                }

                credentialDefinitionState.credentialDefinitionId = credDefId;
            }
            return credentialDefinitionState;
        } catch (error) {
            if (error instanceof notFoundError) {
                return notFoundError(404, {
                    reason: `schema with schemaId "${credentialDefinitionRequest.schemaId}" not found.`,
                })
            }

            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    @Get('/credential-definition/:credentialDefinitionId/:tenantId')
    public async getCredentialDefinitionById(
        @Path('credentialDefinitionId') credentialDefinitionId: CredentialDefinitionId,
        @Path('tenantId') tenantId: string,
        @Res() badRequestError: TsoaResponse<400, { reason: string }>,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            return await tenantAgent.modules.anoncreds.getCredentialDefinition(credentialDefinitionId)
        } catch (error) {
            if (error instanceof AriesFrameworkError && error.message === 'IndyError(LedgerNotFound): LedgerNotFound') {
                return notFoundError(404, {
                    reason: `credential definition with credentialDefinitionId "${credentialDefinitionId}" not found.`,
                })
            } else if (error instanceof AnonCredsError && error.cause instanceof AriesFrameworkError) {
                if (error.cause.cause, 'CommonInvalidStructure') {
                    return badRequestError(400, {
                        reason: `credentialDefinitionId "${credentialDefinitionId}" has invalid structure.`,
                    })
                }
            }
            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    @Post('/credentials/create-offer/:tenantId')
    public async createOffer(
        @Body() createOfferOptions: CreateOfferOptions,
        @Path('tenantId') tenantId: string,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const offer = await tenantAgent.credentials.offerCredential({
                connectionId: createOfferOptions.connectionId,
                protocolVersion: 'v1' as CredentialProtocolVersionType<[]>,
                credentialFormats: createOfferOptions.credentialFormats,
                autoAcceptCredential: createOfferOptions.autoAcceptCredential
            })
            return offer;
        } catch (error) {
            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    @Post('/credentials/create-offer-oob/:tenantId')
    public async createOfferOob(
        @Path('tenantId') tenantId: string,
        @Body() createOfferOptions: CreateOfferOobOptions,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const linkSecretIds = await tenantAgent.modules.anoncreds.getLinkSecretIds()
            if (linkSecretIds.length === 0) {
                await tenantAgent.modules.anoncreds.createLinkSecret()
            }

            const offerOob = await tenantAgent.credentials.createOffer({
                protocolVersion: 'v1' as CredentialProtocolVersionType<[]>,
                credentialFormats: createOfferOptions.credentialFormats,
                autoAcceptCredential: createOfferOptions.autoAcceptCredential,
                comment: createOfferOptions.comment
            });

            const credentialMessage = offerOob.message;
            const outOfBandRecord = await tenantAgent.oob.createInvitation({
                label: 'test-connection',
                handshakeProtocols: [HandshakeProtocol.Connections],
                messages: [credentialMessage],
                autoAcceptConnection: true
            })
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

    @Post('/credentials/accept-offer/:tenantId')
    public async acceptOffer(
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>,
        @Path('tenantId') tenantId: string,
        @Body() acceptCredentialOfferOptions: AcceptCredentialOfferOptions
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const linkSecretIds = await tenantAgent.modules.anoncreds.getLinkSecretIds()
            if (linkSecretIds.length === 0) {
                await tenantAgent.modules.anoncreds.createLinkSecret()
            }
            const acceptOffer = await tenantAgent.credentials.acceptOffer({
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

    @Get('/credentials/:credentialRecordId/:tenantId')
    public async getCredentialById(
        @Path('credentialRecordId') credentialRecordId: RecordId,
        @Path('tenantId') tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const credential = await tenantAgent.credentials.getById(credentialRecordId)
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

    @Get('/credentials/:tenantId')
    public async getAllCredentials(
        @Path('tenantId') tenantId: string,
        @Query('threadId') threadId?: string,
        @Query('connectionId') connectionId?: string,
        @Query('state') state?: CredentialState
    ) {
        const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
        const credentialRepository = tenantAgent.dependencyManager.resolve(CredentialRepository)

        const credentials = await credentialRepository.findByQuery(tenantAgent.context, {
            connectionId,
            threadId,
            state,
        })

        return credentials.map((c: any) => c.toJSON())
    }

    @Get('/proofs/:tenantId')
    public async getAllProofs(
        @Query('threadId') threadId?: string,
        @Path('tenantId') tenantId?: string,
    ) {
        const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });

        let proofs = await tenantAgent.proofs.getAll()

        if (threadId) proofs = proofs.filter((p: any) => p.threadId === threadId)

        return proofs.map((proof: any) => proof.toJSON())
    }

    @Get('/form-data/:tenantId/:proofRecordId')
    @Example<ProofExchangeRecordProps>(ProofRecordExample)
    public async proofFormData(
        @Path('proofRecordId') proofRecordId: string,
        @Path('tenantId') tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const proof = await tenantAgent.proofs.getFormatData(proofRecordId)
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

    @Post('/proofs/request-proof/:tenantId')
    @Example<ProofExchangeRecordProps>(ProofRecordExample)
    public async requestProof(
        @Body() requestProofOptions: RequestProofOptions,
        @Path('tenantId') tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const requestProofPayload = {
                connectionId: requestProofOptions.connectionId,
                protocolVersion: requestProofOptions.protocolVersion as ProofsProtocolVersionType<[]>,
                comment: requestProofOptions.comment,
                proofFormats: requestProofOptions.proofFormats,
                autoAcceptProof: requestProofOptions.autoAcceptProof,
                goalCode: requestProofOptions.goalCode,
                parentThreadId: requestProofOptions.parentThreadId,
                willConfirm: requestProofOptions.willConfirm
            }
            console.log(requestProofPayload);
            const proof = await tenantAgent.proofs.requestProof(requestProofPayload)
            return proof
        } catch (error) {
            return internalServerError(500, { message: `something went wrong: ${error}` })
        }
    }

    @Post('/proofs/create-request-oob/:tenantId')
    public async createRequest(
        @Path('tenantId') tenantId: string,
        @Body() createRequestOptions: CreateProofRequestOobOptions,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const proof = await tenantAgent.proofs.createRequest({
                protocolVersion: createRequestOptions.protocolVersion as ProofsProtocolVersionType<[]>,
                proofFormats: createRequestOptions.proofFormats,
                goalCode: createRequestOptions.goalCode,
                willConfirm: createRequestOptions.willConfirm,
                parentThreadId: createRequestOptions.parentThreadId,
                autoAcceptProof: createRequestOptions.autoAcceptProof,
                comment: createRequestOptions.comment
            });

            const proofMessage = proof.message;
            const outOfBandRecord = await tenantAgent.oob.createInvitation({
                label: 'test-connection',
                handshakeProtocols: [HandshakeProtocol.Connections],
                messages: [proofMessage],
                autoAcceptConnection: true
            })

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

    @Post('/proofs/:proofRecordId/accept-request/:tenantId')
    @Example<ProofExchangeRecordProps>(ProofRecordExample)
    public async acceptRequest(
        @Path('tenantId') tenantId: string,
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
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const requestedCredentials = await tenantAgent.proofs.selectCredentialsForRequest({
                proofRecordId,
            })

            const acceptProofRequest: AcceptProofRequestOptions = {
                proofRecordId,
                comment: request.comment,
                proofFormats: requestedCredentials.proofFormats,
            }

            const proof = await tenantAgent.proofs.acceptRequest(acceptProofRequest)

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

    @Post('/proofs/:proofRecordId/accept-presentation/:tenantId')
    @Example<ProofExchangeRecordProps>(ProofRecordExample)
    public async acceptPresentation(
        @Path('tenantId') tenantId: string,
        @Path('proofRecordId') proofRecordId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const proof = await tenantAgent.proofs.acceptPresentation({ proofRecordId })
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

    @Get('/proofs/:proofRecordId/:tenantId')
    @Example<ProofExchangeRecordProps>(ProofRecordExample)
    public async getProofById(
        @Path('tenantId') tenantId: string,
        @Path('proofRecordId') proofRecordId: RecordId,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId });
            const proof = await tenantAgent.proofs.getById(proofRecordId)

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

    @Get(":tenantId")
    public async getTenantById(
        @Query("tenantId") tenantId: string,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantById(tenantId);
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

    @Post("tenant")
    public async getTenantAgent(
        @Body() tenantAgentOptions: GetTenantAgentOptions,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        try {
            const tenantAgent = await this.agent.modules.tenants.getTenantAgent({ tenantId: tenantAgentOptions.tenantId });
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

    @Delete(":tenantId")
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
        const indyVdrAnonCredsRegistry = new IndyVdrAnonCredsRegistry()
        const schemaDetails = await indyVdrAnonCredsRegistry.getSchema(tenantAgent.context, schemaId)
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

    @Post("with-tenant-agent")
    async withTenantAgent(
        @Body() withTenantAgentOptions: WithTenantAgentOptions,
        @Res() notFoundError: TsoaResponse<404, { reason: string }>,
        @Res() internalServerError: TsoaResponse<500, { message: string }>
    ) {
        const { tenantId, method, payload } = withTenantAgentOptions;

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
                            resolve({ CredentialExchangeRecord: credentials });
                        case "issueCredential":
                            const offerCredential = await tenantAgent.credentials.offerCredential(payload);
                            resolve({ offerCredential });
                            break;

                        case "acceptOffer":
                            var { credentialRecordId, autoAcceptCredential, comment } = payload;
                            var getTenant = await this.agent.modules.tenants.getTenantAgent({ tenantId });
                            const acceptOffer = await this.acceptOfferWithTenant(getTenant, { credentialRecordId, autoAcceptCredential, comment })
                            resolve({ acceptOffer });
                            break;

                        case "createRequestForProofPresentation":
                            const createRequest = await tenantAgent.proofs.requestProof(payload);
                            resolve({ ProofExchangeRecord: createRequest.toJSON() });
                            break;

                        case "acceptRequestForProofPresentation":
                            var { proofRecordId, comment } = payload;
                            const requestedCredentials = await tenantAgent.proofs.selectCredentialsForRequest({
                                proofRecordId,
                            });
                            const acceptProofRequest: AcceptProofRequestOptions = {
                                proofRecordId,
                                comment,
                                proofFormats: requestedCredentials.proofFormats,
                            }

                            const acceptRequest = await tenantAgent.proofs.acceptRequest(acceptProofRequest);
                            resolve({ ProofExchangeRecord: acceptRequest.toJSON() });
                            break;

                        case "acceptPresentation":
                            const acceptPresentation = await tenantAgent.proofs.acceptPresentation(payload);
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
