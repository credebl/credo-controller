/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute, HttpStatusCodeLiteral, TsoaResponse, fetchMiddlewares } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProofController } from './../controllers/proofs/ProofController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { Polygon } from './../controllers/polygon/PolygonController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OutOfBandController } from './../controllers/outofband/OutOfBandController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MultiTenancyController } from './../controllers/multi-tenancy/MultiTenancyController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EndorserTransactionController } from './../controllers/endorser-transaction/EndorserTransactionController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DidController } from './../controllers/did/DidController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SchemaController } from './../controllers/credentials/SchemaController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CredentialDefinitionController } from './../controllers/credentials/CredentialDefinitionController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CredentialController } from './../controllers/credentials/CredentialController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ConnectionController } from './../controllers/connections/ConnectionController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { BasicMessageController } from './../controllers/basic-messages/BasicMessageController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AgentController } from './../controllers/agent/AgentController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { QuestionAnswerController } from './../controllers/question-answer/QuestionAnswerController';
import { expressAuthentication } from './../authentication';
// @ts-ignore - no great way to install types from subpackage
import { iocContainer } from './../utils/tsyringeTsoaIocContainer';
import type { IocContainer, IocContainerFactory } from '@tsoa/runtime';
import type { RequestHandler, Router } from 'express';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "Record_string.unknown_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RecordId": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProofFormat": {
        "dataType": "refObject",
        "properties": {
            "formatKey": {"dataType":"string","required":true},
            "proofFormats": {"dataType":"nestedObjectLiteral","nestedProperties":{"selectCredentialsForRequest":{"dataType":"nestedObjectLiteral","nestedProperties":{"output":{"dataType":"any","required":true},"input":{"dataType":"any","required":true}},"required":true},"getCredentialsForRequest":{"dataType":"nestedObjectLiteral","nestedProperties":{"output":{"dataType":"any","required":true},"input":{"dataType":"any","required":true}},"required":true},"acceptRequest":{"dataType":"any","required":true},"createRequest":{"dataType":"any","required":true},"acceptProposal":{"dataType":"any","required":true},"createProposal":{"dataType":"any","required":true}},"required":true},
            "formatData": {"dataType":"nestedObjectLiteral","nestedProperties":{"presentation":{"dataType":"any","required":true},"request":{"dataType":"any","required":true},"proposal":{"dataType":"any","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AutoAcceptProof": {
        "dataType": "refEnum",
        "enums": ["always","contentApproved","never"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestProofProposalOptions": {
        "dataType": "refObject",
        "properties": {
            "connectionId": {"dataType":"string","required":true},
            "proofFormats": {"dataType":"nestedObjectLiteral","nestedProperties":{"action":{"dataType":"enum","enums":["createProposal"],"required":true},"formats":{"dataType":"array","array":{"dataType":"refObject","ref":"ProofFormat"},"required":true}},"required":true},
            "goalCode": {"dataType":"string"},
            "parentThreadId": {"dataType":"string"},
            "autoAcceptProof": {"ref":"AutoAcceptProof"},
            "comment": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AcceptProofProposal": {
        "dataType": "refObject",
        "properties": {
            "proofRecordId": {"dataType":"string","required":true},
            "proofFormats": {"dataType":"nestedObjectLiteral","nestedProperties":{"action":{"dataType":"enum","enums":["acceptProposal"],"required":true},"formats":{"dataType":"array","array":{"dataType":"refObject","ref":"ProofFormat"},"required":true}},"required":true},
            "comment": {"dataType":"string"},
            "autoAcceptProof": {"ref":"AutoAcceptProof"},
            "goalCode": {"dataType":"string"},
            "willConfirm": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestProofOptions": {
        "dataType": "refObject",
        "properties": {
            "connectionId": {"dataType":"string","required":true},
            "protocolVersion": {"dataType":"string","required":true},
            "proofFormats": {"dataType":"any","required":true},
            "comment": {"dataType":"string","required":true},
            "autoAcceptProof": {"ref":"AutoAcceptProof","required":true},
            "goalCode": {"dataType":"string"},
            "parentThreadId": {"dataType":"string"},
            "willConfirm": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateProofRequestOobOptions": {
        "dataType": "refObject",
        "properties": {
            "protocolVersion": {"dataType":"string","required":true},
            "proofFormats": {"dataType":"any","required":true},
            "goalCode": {"dataType":"string"},
            "parentThreadId": {"dataType":"string"},
            "willConfirm": {"dataType":"boolean"},
            "autoAcceptProof": {"ref":"AutoAcceptProof"},
            "comment": {"dataType":"string"},
            "label": {"dataType":"string"},
            "imageUrl": {"dataType":"string"},
            "recipientKey": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HandshakeProtocol": {
        "dataType": "refEnum",
        "enums": ["https://didcomm.org/didexchange/1.x","https://didcomm.org/connections/1.x"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PlaintextMessage": {
        "dataType": "refObject",
        "properties": {
            "@type": {"dataType":"string","required":true},
            "@id": {"dataType":"string","required":true},
            "~thread": {"dataType":"nestedObjectLiteral","nestedProperties":{"pthid":{"dataType":"string"},"thid":{"dataType":"string"}}},
        },
        "additionalProperties": {"dataType":"any"},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AgentMessage": {
        "dataType": "refAlias",
        "type": {"ref":"PlaintextMessage","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "KeyType": {
        "dataType": "refEnum",
        "enums": ["ed25519","bls12381g1g2","bls12381g1","bls12381g2","x25519","p256","p384","p521","k256"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Key": {
        "dataType": "refObject",
        "properties": {
            "publicKey": {"dataType":"buffer","required":true},
            "keyType": {"ref":"KeyType","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Routing": {
        "dataType": "refObject",
        "properties": {
            "endpoints": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "recipientKey": {"ref":"Key","required":true},
            "routingKeys": {"dataType":"array","array":{"dataType":"refObject","ref":"Key"},"required":true},
            "mediatorId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonValue": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"dataType":"enum","enums":[null]},{"ref":"JsonObject"},{"ref":"JsonArray"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonObject": {
        "dataType": "refObject",
        "properties": {
        },
        "additionalProperties": {"ref":"JsonValue"},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonArray": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"refAlias","ref":"JsonValue"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_JwsGeneralFormat.Exclude_keyofJwsGeneralFormat.payload__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"header":{"ref":"Record_string.unknown_","required":true},"signature":{"dataType":"string","required":true},"protected":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_JwsGeneralFormat.payload_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_JwsGeneralFormat.Exclude_keyofJwsGeneralFormat.payload__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JwsDetachedFormat": {
        "dataType": "refAlias",
        "type": {"ref":"Omit_JwsGeneralFormat.payload_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JwsFlattenedDetachedFormat": {
        "dataType": "refObject",
        "properties": {
            "signatures": {"dataType":"array","array":{"dataType":"refAlias","ref":"JwsDetachedFormat"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AttachmentData": {
        "dataType": "refObject",
        "properties": {
            "base64": {"dataType":"string"},
            "json": {"ref":"JsonValue"},
            "links": {"dataType":"array","array":{"dataType":"string"}},
            "jws": {"dataType":"union","subSchemas":[{"ref":"JwsDetachedFormat"},{"ref":"JwsFlattenedDetachedFormat"}]},
            "sha256": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Attachment": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "filename": {"dataType":"string"},
            "mimeType": {"dataType":"string"},
            "lastmodTime": {"dataType":"datetime"},
            "byteCount": {"dataType":"double"},
            "data": {"ref":"AttachmentData","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateInvitationOptions": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "alias": {"dataType":"string"},
            "imageUrl": {"dataType":"string"},
            "goalCode": {"dataType":"string"},
            "goal": {"dataType":"string"},
            "handshake": {"dataType":"boolean"},
            "handshakeProtocols": {"dataType":"array","array":{"dataType":"refEnum","ref":"HandshakeProtocol"}},
            "messages": {"dataType":"array","array":{"dataType":"refAlias","ref":"AgentMessage"}},
            "multiUseInvitation": {"dataType":"boolean"},
            "autoAcceptConnection": {"dataType":"boolean"},
            "routing": {"ref":"Routing"},
            "appendedAttachments": {"dataType":"array","array":{"dataType":"refObject","ref":"Attachment"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_CreateLegacyInvitationConfig.Exclude_keyofCreateLegacyInvitationConfig.routing__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string"},"alias":{"dataType":"string"},"imageUrl":{"dataType":"string"},"multiUseInvitation":{"dataType":"boolean"},"autoAcceptConnection":{"dataType":"boolean"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_CreateLegacyInvitationConfig.routing_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_CreateLegacyInvitationConfig.Exclude_keyofCreateLegacyInvitationConfig.routing__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RecipientKeyOption": {
        "dataType": "refObject",
        "properties": {
            "recipientKey": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AgentMessageType": {
        "dataType": "refObject",
        "properties": {
            "@id": {"dataType":"string","required":true},
            "@type": {"dataType":"string","required":true},
        },
        "additionalProperties": {"dataType":"any"},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OutOfBandDidCommService": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "serviceEndpoint": {"dataType":"string","required":true},
            "type": {"dataType":"string","required":true},
            "recipientKeys": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "routingKeys": {"dataType":"array","array":{"dataType":"string"}},
            "accept": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OutOfBandInvitationSchema": {
        "dataType": "refObject",
        "properties": {
            "@id": {"dataType":"string"},
            "@type": {"dataType":"string","required":true},
            "label": {"dataType":"string","required":true},
            "goalCode": {"dataType":"string"},
            "goal": {"dataType":"string"},
            "accept": {"dataType":"array","array":{"dataType":"string"}},
            "handshake_protocols": {"dataType":"array","array":{"dataType":"refEnum","ref":"HandshakeProtocol"}},
            "services": {"dataType":"array","array":{"dataType":"union","subSchemas":[{"ref":"OutOfBandDidCommService"},{"dataType":"string"}]},"required":true},
            "imageUrl": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_ReceiveOutOfBandInvitationConfig.Exclude_keyofReceiveOutOfBandInvitationConfig.routing__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string"},"alias":{"dataType":"string"},"imageUrl":{"dataType":"string"},"autoAcceptConnection":{"dataType":"boolean"},"autoAcceptInvitation":{"dataType":"boolean"},"reuseConnection":{"dataType":"boolean"},"acceptInvitationTimeoutMs":{"dataType":"double"},"ourDid":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_ReceiveOutOfBandInvitationConfig.routing_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_ReceiveOutOfBandInvitationConfig.Exclude_keyofReceiveOutOfBandInvitationConfig.routing__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReceiveInvitationProps": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "alias": {"dataType":"string"},
            "imageUrl": {"dataType":"string"},
            "autoAcceptConnection": {"dataType":"boolean"},
            "autoAcceptInvitation": {"dataType":"boolean"},
            "reuseConnection": {"dataType":"boolean"},
            "acceptInvitationTimeoutMs": {"dataType":"double"},
            "ourDid": {"dataType":"string"},
            "invitation": {"ref":"OutOfBandInvitationSchema","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReceiveInvitationByUrlProps": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string"},
            "alias": {"dataType":"string"},
            "imageUrl": {"dataType":"string"},
            "autoAcceptConnection": {"dataType":"boolean"},
            "autoAcceptInvitation": {"dataType":"boolean"},
            "reuseConnection": {"dataType":"boolean"},
            "acceptInvitationTimeoutMs": {"dataType":"double"},
            "ourDid": {"dataType":"string"},
            "invitationUrl": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AcceptInvitationConfig": {
        "dataType": "refObject",
        "properties": {
            "autoAcceptConnection": {"dataType":"boolean"},
            "reuseConnection": {"dataType":"boolean"},
            "label": {"dataType":"string"},
            "alias": {"dataType":"string"},
            "imageUrl": {"dataType":"string"},
            "mediatorId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_TenantConfig.Exclude_keyofTenantConfig.walletConfig__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string","required":true},"connectionImageUrl":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_TenantConfig.walletConfig_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_TenantConfig.Exclude_keyofTenantConfig.walletConfig__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTenantOptions": {
        "dataType": "refObject",
        "properties": {
            "config": {"ref":"Omit_TenantConfig.walletConfig_","required":true},
            "seed": {"dataType":"string"},
            "method": {"dataType":"string"},
            "role": {"dataType":"string"},
            "endorserDid": {"dataType":"string"},
            "did": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.any_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DidDocument": {
        "dataType": "refAlias",
        "type": {"ref":"Record_string.any_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DidCreate": {
        "dataType": "refObject",
        "properties": {
            "keyType": {"ref":"KeyType","required":true},
            "seed": {"dataType":"string"},
            "domain": {"dataType":"string"},
            "method": {"dataType":"string","required":true},
            "network": {"dataType":"string"},
            "did": {"dataType":"string"},
            "role": {"dataType":"string"},
            "endorserDid": {"dataType":"string"},
            "didDocument": {"ref":"DidDocument"},
            "privatekey": {"dataType":"string"},
            "endpoint": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DidNymTransaction": {
        "dataType": "refObject",
        "properties": {
            "did": {"dataType":"string","required":true},
            "nymRequest": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EndorserTransaction": {
        "dataType": "refObject",
        "properties": {
            "transaction": {"dataType":"union","subSchemas":[{"dataType":"string"},{"ref":"Record_string.unknown_"}],"required":true},
            "endorserDid": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_CreateOutOfBandInvitationConfig.Exclude_keyofCreateOutOfBandInvitationConfig.routing-or-appendedAttachments-or-messages__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"label":{"dataType":"string"},"alias":{"dataType":"string"},"imageUrl":{"dataType":"string"},"multiUseInvitation":{"dataType":"boolean"},"autoAcceptConnection":{"dataType":"boolean"},"goalCode":{"dataType":"string"},"goal":{"dataType":"string"},"handshake":{"dataType":"boolean"},"handshakeProtocols":{"dataType":"array","array":{"dataType":"refEnum","ref":"HandshakeProtocol"}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_CreateOutOfBandInvitationConfig.routing-or-appendedAttachments-or-messages_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_CreateOutOfBandInvitationConfig.Exclude_keyofCreateOutOfBandInvitationConfig.routing-or-appendedAttachments-or-messages__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DidExchangeState": {
        "dataType": "refEnum",
        "enums": ["start","invitation-sent","invitation-received","request-sent","request-received","response-sent","response-received","abandoned","completed"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Version": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WriteTransaction": {
        "dataType": "refObject",
        "properties": {
            "endorsedTransaction": {"dataType":"string","required":true},
            "endorserDid": {"dataType":"string"},
            "schema": {"dataType":"nestedObjectLiteral","nestedProperties":{"attributes":{"dataType":"array","array":{"dataType":"string"},"required":true},"version":{"ref":"Version","required":true},"name":{"dataType":"string","required":true},"issuerId":{"dataType":"string","required":true}}},
            "credentialDefinition": {"dataType":"nestedObjectLiteral","nestedProperties":{"type":{"dataType":"string","required":true},"value":{"dataType":"any","required":true},"tag":{"dataType":"string","required":true},"issuerId":{"dataType":"string","required":true},"schemaId":{"dataType":"string","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SchemaId": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CredentialDefinitionId": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AutoAcceptCredential": {
        "dataType": "refEnum",
        "enums": ["always","contentApproved","never"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateOfferOptions": {
        "dataType": "refObject",
        "properties": {
            "protocolVersion": {"dataType":"string","required":true},
            "connectionId": {"dataType":"string","required":true},
            "credentialFormats": {"dataType":"any","required":true},
            "autoAcceptCredential": {"ref":"AutoAcceptCredential"},
            "comment": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CredentialPreviewAttributeOptions": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "mimeType": {"dataType":"string"},
            "value": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LinkedAttachment": {
        "dataType": "refObject",
        "properties": {
            "attributeName": {"dataType":"string","required":true},
            "attachment": {"ref":"Attachment","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AnonCredsOfferCredentialFormat": {
        "dataType": "refObject",
        "properties": {
            "credentialDefinitionId": {"dataType":"string","required":true},
            "revocationRegistryDefinitionId": {"dataType":"string"},
            "revocationRegistryIndex": {"dataType":"double"},
            "attributes": {"dataType":"array","array":{"dataType":"refObject","ref":"CredentialPreviewAttributeOptions"},"required":true},
            "linkedAttachments": {"dataType":"array","array":{"dataType":"refObject","ref":"LinkedAttachment"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "W3cIssuerOptions": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SingleOrArray_JsonObject_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"JsonObject"},{"dataType":"array","array":{"dataType":"refObject","ref":"JsonObject"}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonCredential": {
        "dataType": "refObject",
        "properties": {
            "@context": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"ref":"JsonObject"}],"required":true},
            "id": {"dataType":"string"},
            "type": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "issuer": {"dataType":"union","subSchemas":[{"dataType":"string"},{"ref":"W3cIssuerOptions"}],"required":true},
            "issuanceDate": {"dataType":"string","required":true},
            "expirationDate": {"dataType":"string"},
            "credentialSubject": {"ref":"SingleOrArray_JsonObject_","required":true},
        },
        "additionalProperties": {"dataType":"any"},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JsonLdCredentialDetailFormat": {
        "dataType": "refObject",
        "properties": {
            "credential": {"ref":"JsonCredential","required":true},
            "options": {"dataType":"nestedObjectLiteral","nestedProperties":{"proofType":{"dataType":"string","required":true},"proofPurpose":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CredentialFormatPayload_CredentialFormatType-Array.createOffer_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"indy":{"ref":"AnonCredsOfferCredentialFormat"},"jsonld":{"ref":"JsonLdCredentialDetailFormat"},"anoncreds":{"ref":"AnonCredsOfferCredentialFormat"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateOfferOobOptions": {
        "dataType": "refObject",
        "properties": {
            "protocolVersion": {"dataType":"string","required":true},
            "credentialFormats": {"ref":"CredentialFormatPayload_CredentialFormatType-Array.createOffer_","required":true},
            "autoAcceptCredential": {"ref":"AutoAcceptCredential"},
            "comment": {"dataType":"string"},
            "goalCode": {"dataType":"string"},
            "parentThreadId": {"dataType":"string"},
            "willConfirm": {"dataType":"boolean"},
            "label": {"dataType":"string"},
            "imageUrl": {"dataType":"string"},
            "recipientKey": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CredentialFormatPayload_CredentialFormatsFromProtocols_CredentialProtocol-Array_.acceptOffer_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AcceptCredentialOfferOptions": {
        "dataType": "refObject",
        "properties": {
            "autoAcceptCredential": {"ref":"AutoAcceptCredential"},
            "comment": {"dataType":"string"},
            "credentialRecordId": {"dataType":"string","required":true},
            "credentialFormats": {"ref":"CredentialFormatPayload_CredentialFormatsFromProtocols_CredentialProtocol-Array_.acceptOffer_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CredentialState": {
        "dataType": "refEnum",
        "enums": ["proposal-sent","proposal-received","offer-sent","offer-received","declined","request-sent","request-received","credential-issued","credential-received","done","abandoned"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "QuestionAnswerRole": {
        "dataType": "refEnum",
        "enums": ["questioner","responder"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "QuestionAnswerState": {
        "dataType": "refEnum",
        "enums": ["question-sent","question-received","answer-received","answer-sent"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidResponse": {
        "dataType": "refObject",
        "properties": {
            "text": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_response.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"response":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DidResolutionMetadata": {
        "dataType": "refObject",
        "properties": {
            "contentType": {"dataType":"string"},
            "error": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["invalidDid"]},{"dataType":"enum","enums":["notFound"]},{"dataType":"enum","enums":["representationNotSupported"]},{"dataType":"enum","enums":["unsupportedDidMethod"]},{"dataType":"string"}]},
            "message": {"dataType":"string"},
            "servedFromCache": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DIDDocumentMetadata": {
        "dataType": "refObject",
        "properties": {
            "created": {"dataType":"string"},
            "updated": {"dataType":"string"},
            "deactivated": {"dataType":"boolean"},
            "versionId": {"dataType":"string"},
            "nextUpdate": {"dataType":"string"},
            "nextVersionId": {"dataType":"string"},
            "equivalentId": {"dataType":"string"},
            "canonicalId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Did": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "W3cCredentialRecord": {
        "dataType": "refAlias",
        "type": {"ref":"Record_string.unknown_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ConnectionRecord": {
        "dataType": "refAlias",
        "type": {"ref":"Record_string.unknown_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProposeCredentialOptions": {
        "dataType": "refObject",
        "properties": {
            "connectionRecord": {"ref":"ConnectionRecord","required":true},
            "credentialFormats": {"dataType":"nestedObjectLiteral","nestedProperties":{"indy":{"dataType":"nestedObjectLiteral","nestedProperties":{"attributes":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}}},"required":true},"issuerDid":{"dataType":"string","required":true},"credentialDefinitionId":{"dataType":"string","required":true},"schemaVersion":{"dataType":"string","required":true},"schemaName":{"dataType":"string","required":true},"schemaId":{"dataType":"string","required":true},"schemaIssuerDid":{"dataType":"string","required":true}},"required":true}},"required":true},
            "autoAcceptCredential": {"ref":"AutoAcceptCredential"},
            "comment": {"dataType":"string"},
            "connectionId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CredentialFormatPayload_CredentialFormats.acceptProposal_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AcceptCredentialProposalOptions": {
        "dataType": "refObject",
        "properties": {
            "credentialRecordId": {"dataType":"string","required":true},
            "credentialFormats": {"ref":"CredentialFormatPayload_CredentialFormats.acceptProposal_"},
            "autoAcceptCredential": {"ref":"AutoAcceptCredential"},
            "comment": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CredentialFormatPayload_CredentialFormats.acceptOffer_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CredentialOfferOptions": {
        "dataType": "refObject",
        "properties": {
            "credentialRecordId": {"dataType":"string","required":true},
            "credentialFormats": {"ref":"CredentialFormatPayload_CredentialFormats.acceptOffer_"},
            "autoAcceptCredential": {"ref":"AutoAcceptCredential"},
            "comment": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CredentialExchangeRecord": {
        "dataType": "refAlias",
        "type": {"ref":"Record_string.unknown_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CredentialFormatPayload_CredentialFormats.acceptRequest_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AcceptCredentialRequestOptions": {
        "dataType": "refObject",
        "properties": {
            "credentialRecord": {"ref":"CredentialExchangeRecord","required":true},
            "credentialFormats": {"ref":"CredentialFormatPayload_CredentialFormats.acceptRequest_"},
            "autoAcceptCredential": {"ref":"AutoAcceptCredential"},
            "comment": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AcceptCredential": {
        "dataType": "refObject",
        "properties": {
            "credentialRecord": {"ref":"CredentialExchangeRecord","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BasicMessageRecord": {
        "dataType": "refAlias",
        "type": {"ref":"Record_string.unknown_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_content.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"content":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AgentInfo": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
            "endpoints": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "isInitialized": {"dataType":"boolean","required":true},
            "publicDid": {"dataType":"void","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const validationService = new ValidationService(models);

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: Router) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
        app.get('/proofs',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProofController)),
            ...(fetchMiddlewares<RequestHandler>(ProofController.prototype.getAllProofs)),

            async function ProofController_getAllProofs(request: any, response: any, next: any) {
            const args = {
                    threadId: {"in":"query","name":"threadId","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ProofController>(ProofController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getAllProofs.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/proofs/:proofRecordId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProofController)),
            ...(fetchMiddlewares<RequestHandler>(ProofController.prototype.getProofById)),

            async function ProofController_getProofById(request: any, response: any, next: any) {
            const args = {
                    proofRecordId: {"in":"path","name":"proofRecordId","required":true,"ref":"RecordId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ProofController>(ProofController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getProofById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/proofs/propose-proof',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProofController)),
            ...(fetchMiddlewares<RequestHandler>(ProofController.prototype.proposeProof)),

            async function ProofController_proposeProof(request: any, response: any, next: any) {
            const args = {
                    requestProofProposalOptions: {"in":"body","name":"requestProofProposalOptions","required":true,"ref":"RequestProofProposalOptions"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ProofController>(ProofController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.proposeProof.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/proofs/:proofRecordId/accept-proposal',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProofController)),
            ...(fetchMiddlewares<RequestHandler>(ProofController.prototype.acceptProposal)),

            async function ProofController_acceptProposal(request: any, response: any, next: any) {
            const args = {
                    acceptProposal: {"in":"body","name":"acceptProposal","required":true,"ref":"AcceptProofProposal"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ProofController>(ProofController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptProposal.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/proofs/request-proof',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProofController)),
            ...(fetchMiddlewares<RequestHandler>(ProofController.prototype.requestProof)),

            async function ProofController_requestProof(request: any, response: any, next: any) {
            const args = {
                    requestProofOptions: {"in":"body","name":"requestProofOptions","required":true,"ref":"RequestProofOptions"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ProofController>(ProofController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.requestProof.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/proofs/create-request-oob',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProofController)),
            ...(fetchMiddlewares<RequestHandler>(ProofController.prototype.createRequest)),

            async function ProofController_createRequest(request: any, response: any, next: any) {
            const args = {
                    createRequestOptions: {"in":"body","name":"createRequestOptions","required":true,"ref":"CreateProofRequestOobOptions"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ProofController>(ProofController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createRequest.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/proofs/:proofRecordId/accept-request',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProofController)),
            ...(fetchMiddlewares<RequestHandler>(ProofController.prototype.acceptRequest)),

            async function ProofController_acceptRequest(request: any, response: any, next: any) {
            const args = {
                    proofRecordId: {"in":"path","name":"proofRecordId","required":true,"dataType":"string"},
                    request: {"in":"body","name":"request","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"comment":{"dataType":"string"},"filterByNonRevocationRequirements":{"dataType":"boolean"},"filterByPresentationPreview":{"dataType":"boolean"}}},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ProofController>(ProofController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptRequest.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/proofs/:proofRecordId/accept-presentation',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProofController)),
            ...(fetchMiddlewares<RequestHandler>(ProofController.prototype.acceptPresentation)),

            async function ProofController_acceptPresentation(request: any, response: any, next: any) {
            const args = {
                    proofRecordId: {"in":"path","name":"proofRecordId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ProofController>(ProofController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptPresentation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/proofs/:proofRecordId/form-data',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProofController)),
            ...(fetchMiddlewares<RequestHandler>(ProofController.prototype.proofFormData)),

            async function ProofController_proofFormData(request: any, response: any, next: any) {
            const args = {
                    proofRecordId: {"in":"path","name":"proofRecordId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ProofController>(ProofController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.proofFormData.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/polygon/create-keys',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Polygon)),
            ...(fetchMiddlewares<RequestHandler>(Polygon.prototype.createKeyPair)),

            async function Polygon_createKeyPair(request: any, response: any, next: any) {
            const args = {
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<Polygon>(Polygon);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createKeyPair.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/polygon/create-schema',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Polygon)),
            ...(fetchMiddlewares<RequestHandler>(Polygon.prototype.createSchema)),

            async function Polygon_createSchema(request: any, response: any, next: any) {
            const args = {
                    createSchemaRequest: {"in":"body","name":"createSchemaRequest","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"schema":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"required":true},"schemaName":{"dataType":"string","required":true},"did":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    badRequestError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<Polygon>(Polygon);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createSchema.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/polygon/estimate-transaction',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Polygon)),
            ...(fetchMiddlewares<RequestHandler>(Polygon.prototype.estimateTransaction)),

            async function Polygon_estimateTransaction(request: any, response: any, next: any) {
            const args = {
                    estimateTransactionRequest: {"in":"body","name":"estimateTransactionRequest","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"transaction":{"dataType":"any","required":true},"operation":{"dataType":"any","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    badRequestError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<Polygon>(Polygon);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.estimateTransaction.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/polygon/:did/:schemaId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Polygon)),
            ...(fetchMiddlewares<RequestHandler>(Polygon.prototype.getSchemaById)),

            async function Polygon_getSchemaById(request: any, response: any, next: any) {
            const args = {
                    did: {"in":"path","name":"did","required":true,"dataType":"string"},
                    schemaId: {"in":"path","name":"schemaId","required":true,"dataType":"string"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    forbiddenError: {"in":"res","name":"401","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<Polygon>(Polygon);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getSchemaById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/oob',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController)),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController.prototype.getAllOutOfBandRecords)),

            async function OutOfBandController_getAllOutOfBandRecords(request: any, response: any, next: any) {
            const args = {
                    invitationId: {"in":"query","name":"invitationId","ref":"RecordId"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<OutOfBandController>(OutOfBandController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getAllOutOfBandRecords.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/oob/:outOfBandId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController)),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController.prototype.getOutOfBandRecordById)),

            async function OutOfBandController_getOutOfBandRecordById(request: any, response: any, next: any) {
            const args = {
                    outOfBandId: {"in":"path","name":"outOfBandId","required":true,"ref":"RecordId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<OutOfBandController>(OutOfBandController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getOutOfBandRecordById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/oob/create-invitation',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController)),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController.prototype.createInvitation)),

            async function OutOfBandController_createInvitation(request: any, response: any, next: any) {
            const args = {
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    config: {"in":"body","name":"config","required":true,"ref":"CreateInvitationOptions"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<OutOfBandController>(OutOfBandController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createInvitation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/oob/create-legacy-invitation',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController)),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController.prototype.createLegacyInvitation)),

            async function OutOfBandController_createLegacyInvitation(request: any, response: any, next: any) {
            const args = {
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    config: {"in":"body","name":"config","dataType":"intersection","subSchemas":[{"ref":"Omit_CreateLegacyInvitationConfig.routing_"},{"ref":"RecipientKeyOption"}]},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<OutOfBandController>(OutOfBandController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createLegacyInvitation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/oob/create-legacy-connectionless-invitation',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController)),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController.prototype.createLegacyConnectionlessInvitation)),

            async function OutOfBandController_createLegacyConnectionlessInvitation(request: any, response: any, next: any) {
            const args = {
                    config: {"in":"body","name":"config","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"domain":{"dataType":"string","required":true},"message":{"ref":"AgentMessageType","required":true},"recordId":{"dataType":"string","required":true}}},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<OutOfBandController>(OutOfBandController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createLegacyConnectionlessInvitation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/oob/receive-invitation',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController)),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController.prototype.receiveInvitation)),

            async function OutOfBandController_receiveInvitation(request: any, response: any, next: any) {
            const args = {
                    invitationRequest: {"in":"body","name":"invitationRequest","required":true,"ref":"ReceiveInvitationProps"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<OutOfBandController>(OutOfBandController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.receiveInvitation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/oob/receive-invitation-url',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController)),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController.prototype.receiveInvitationFromUrl)),

            async function OutOfBandController_receiveInvitationFromUrl(request: any, response: any, next: any) {
            const args = {
                    invitationRequest: {"in":"body","name":"invitationRequest","required":true,"ref":"ReceiveInvitationByUrlProps"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<OutOfBandController>(OutOfBandController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.receiveInvitationFromUrl.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/oob/:outOfBandId/accept-invitation',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController)),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController.prototype.acceptInvitation)),

            async function OutOfBandController_acceptInvitation(request: any, response: any, next: any) {
            const args = {
                    outOfBandId: {"in":"path","name":"outOfBandId","required":true,"ref":"RecordId"},
                    acceptInvitationConfig: {"in":"body","name":"acceptInvitationConfig","required":true,"ref":"AcceptInvitationConfig"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<OutOfBandController>(OutOfBandController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptInvitation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/oob/:outOfBandId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController)),
            ...(fetchMiddlewares<RequestHandler>(OutOfBandController.prototype.deleteOutOfBandRecord)),

            async function OutOfBandController_deleteOutOfBandRecord(request: any, response: any, next: any) {
            const args = {
                    outOfBandId: {"in":"path","name":"outOfBandId","required":true,"ref":"RecordId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<OutOfBandController>(OutOfBandController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.deleteOutOfBandRecord.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/create-tenant',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createTenant)),

            async function MultiTenancyController_createTenant(request: any, response: any, next: any) {
            const args = {
                    createTenantOptions: {"in":"body","name":"createTenantOptions","required":true,"ref":"CreateTenantOptions"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createTenant.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/create-did/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createDid)),

            async function MultiTenancyController_createDid(request: any, response: any, next: any) {
            const args = {
                    createDidOptions: {"in":"body","name":"createDidOptions","required":true,"ref":"DidCreate"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createDid.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/dids/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getDids)),

            async function MultiTenancyController_getDids(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getDids.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/transactions/set-endorser-role/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.didNymTransaction)),

            async function MultiTenancyController_didNymTransaction(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    didNymTransaction: {"in":"body","name":"didNymTransaction","required":true,"ref":"DidNymTransaction"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.didNymTransaction.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/transactions/endorse/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.endorserTransaction)),

            async function MultiTenancyController_endorserTransaction(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    endorserTransaction: {"in":"body","name":"endorserTransaction","required":true,"ref":"EndorserTransaction"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    forbiddenError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.endorserTransaction.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/connections/:connectionId/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getConnectionById)),

            async function MultiTenancyController_getConnectionById(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    connectionId: {"in":"path","name":"connectionId","required":true,"ref":"RecordId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getConnectionById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/create-invitation/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createInvitation)),

            async function MultiTenancyController_createInvitation(request: any, response: any, next: any) {
            const args = {
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    config: {"in":"body","name":"config","ref":"Omit_CreateOutOfBandInvitationConfig.routing-or-appendedAttachments-or-messages_"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createInvitation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/create-legacy-invitation/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createLegacyInvitation)),

            async function MultiTenancyController_createLegacyInvitation(request: any, response: any, next: any) {
            const args = {
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    config: {"in":"body","name":"config","dataType":"intersection","subSchemas":[{"ref":"Omit_CreateOutOfBandInvitationConfig.routing-or-appendedAttachments-or-messages_"},{"ref":"RecipientKeyOption"}]},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createLegacyInvitation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/receive-invitation/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.receiveInvitation)),

            async function MultiTenancyController_receiveInvitation(request: any, response: any, next: any) {
            const args = {
                    invitationRequest: {"in":"body","name":"invitationRequest","required":true,"ref":"ReceiveInvitationProps"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.receiveInvitation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/receive-invitation-url/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.receiveInvitationFromUrl)),

            async function MultiTenancyController_receiveInvitationFromUrl(request: any, response: any, next: any) {
            const args = {
                    invitationRequest: {"in":"body","name":"invitationRequest","required":true,"ref":"ReceiveInvitationByUrlProps"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.receiveInvitationFromUrl.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/oob/:invitationId/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getAllOutOfBandRecords)),

            async function MultiTenancyController_getAllOutOfBandRecords(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    invitationId: {"in":"path","name":"invitationId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getAllOutOfBandRecords.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/connections/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getAllConnections)),

            async function MultiTenancyController_getAllConnections(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    outOfBandId: {"in":"query","name":"outOfBandId","dataType":"string"},
                    alias: {"in":"query","name":"alias","dataType":"string"},
                    state: {"in":"query","name":"state","ref":"DidExchangeState"},
                    myDid: {"in":"query","name":"myDid","dataType":"string"},
                    theirDid: {"in":"query","name":"theirDid","dataType":"string"},
                    theirLabel: {"in":"query","name":"theirLabel","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getAllConnections.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/url/:tenantId/:invitationId',
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getInvitation)),

            async function MultiTenancyController_getInvitation(request: any, response: any, next: any) {
            const args = {
                    invitationId: {"in":"path","name":"invitationId","required":true,"dataType":"string"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getInvitation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/schema/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createSchema)),

            async function MultiTenancyController_createSchema(request: any, response: any, next: any) {
            const args = {
                    schema: {"in":"body","name":"schema","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"endorserDid":{"dataType":"string"},"endorse":{"dataType":"boolean"},"attributes":{"dataType":"array","array":{"dataType":"string"},"required":true},"version":{"ref":"Version","required":true},"name":{"dataType":"string","required":true},"issuerId":{"dataType":"string","required":true}}},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    forbiddenError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createSchema.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/polygon-wc3/schema/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createPolygonW3CSchema)),

            async function MultiTenancyController_createPolygonW3CSchema(request: any, response: any, next: any) {
            const args = {
                    createSchemaRequest: {"in":"body","name":"createSchemaRequest","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"schema":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"required":true},"schemaName":{"dataType":"string","required":true},"did":{"dataType":"string","required":true}}},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createPolygonW3CSchema.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/polygon-wc3/schema/:did/:schemaId/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getPolygonW3CSchemaById)),

            async function MultiTenancyController_getPolygonW3CSchemaById(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    did: {"in":"path","name":"did","required":true,"dataType":"string"},
                    schemaId: {"in":"path","name":"schemaId","required":true,"dataType":"string"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    badRequestError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    forbiddenError: {"in":"res","name":"401","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getPolygonW3CSchemaById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/transactions/write/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.writeSchemaAndCredDefOnLedger)),

            async function MultiTenancyController_writeSchemaAndCredDefOnLedger(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    forbiddenError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    writeTransaction: {"in":"body","name":"writeTransaction","required":true,"ref":"WriteTransaction"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.writeSchemaAndCredDefOnLedger.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/schema/:schemaId/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getSchemaById)),

            async function MultiTenancyController_getSchemaById(request: any, response: any, next: any) {
            const args = {
                    schemaId: {"in":"path","name":"schemaId","required":true,"ref":"SchemaId"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    forbiddenError: {"in":"res","name":"403","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    badRequestError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getSchemaById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/credential-definition/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createCredentialDefinition)),

            async function MultiTenancyController_createCredentialDefinition(request: any, response: any, next: any) {
            const args = {
                    credentialDefinitionRequest: {"in":"body","name":"credentialDefinitionRequest","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"endorserDid":{"dataType":"string"},"endorse":{"dataType":"boolean"},"tag":{"dataType":"string","required":true},"schemaId":{"dataType":"string","required":true},"issuerId":{"dataType":"string","required":true}}},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createCredentialDefinition.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/credential-definition/:credentialDefinitionId/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getCredentialDefinitionById)),

            async function MultiTenancyController_getCredentialDefinitionById(request: any, response: any, next: any) {
            const args = {
                    credentialDefinitionId: {"in":"path","name":"credentialDefinitionId","required":true,"ref":"CredentialDefinitionId"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    badRequestError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getCredentialDefinitionById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/credentials/create-offer/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createOffer)),

            async function MultiTenancyController_createOffer(request: any, response: any, next: any) {
            const args = {
                    createOfferOptions: {"in":"body","name":"createOfferOptions","required":true,"ref":"CreateOfferOptions"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createOffer.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/credentials/create-offer-oob/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createOfferOob)),

            async function MultiTenancyController_createOfferOob(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    createOfferOptions: {"in":"body","name":"createOfferOptions","required":true,"ref":"CreateOfferOobOptions"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createOfferOob.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/credentials/accept-offer/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.acceptOffer)),

            async function MultiTenancyController_acceptOffer(request: any, response: any, next: any) {
            const args = {
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    acceptCredentialOfferOptions: {"in":"body","name":"acceptCredentialOfferOptions","required":true,"ref":"AcceptCredentialOfferOptions"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptOffer.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/credentials/:credentialRecordId/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getCredentialById)),

            async function MultiTenancyController_getCredentialById(request: any, response: any, next: any) {
            const args = {
                    credentialRecordId: {"in":"path","name":"credentialRecordId","required":true,"ref":"RecordId"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getCredentialById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/credentials/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getAllCredentials)),

            async function MultiTenancyController_getAllCredentials(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    threadId: {"in":"query","name":"threadId","dataType":"string"},
                    connectionId: {"in":"query","name":"connectionId","dataType":"string"},
                    state: {"in":"query","name":"state","ref":"CredentialState"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getAllCredentials.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/proofs/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getAllProofs)),

            async function MultiTenancyController_getAllProofs(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    threadId: {"in":"query","name":"threadId","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getAllProofs.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/form-data/:tenantId/:proofRecordId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.proofFormData)),

            async function MultiTenancyController_proofFormData(request: any, response: any, next: any) {
            const args = {
                    proofRecordId: {"in":"path","name":"proofRecordId","required":true,"dataType":"string"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.proofFormData.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/proofs/request-proof/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.requestProof)),

            async function MultiTenancyController_requestProof(request: any, response: any, next: any) {
            const args = {
                    requestProofOptions: {"in":"body","name":"requestProofOptions","required":true,"ref":"RequestProofOptions"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.requestProof.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/proofs/create-request-oob/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createRequest)),

            async function MultiTenancyController_createRequest(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    createRequestOptions: {"in":"body","name":"createRequestOptions","required":true,"ref":"CreateProofRequestOobOptions"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createRequest.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/proofs/:proofRecordId/accept-request/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.acceptRequest)),

            async function MultiTenancyController_acceptRequest(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    proofRecordId: {"in":"path","name":"proofRecordId","required":true,"dataType":"string"},
                    request: {"in":"body","name":"request","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"comment":{"dataType":"string"},"filterByNonRevocationRequirements":{"dataType":"boolean"},"filterByPresentationPreview":{"dataType":"boolean"}}},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptRequest.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/proofs/:proofRecordId/accept-presentation/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.acceptPresentation)),

            async function MultiTenancyController_acceptPresentation(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    proofRecordId: {"in":"path","name":"proofRecordId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptPresentation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/proofs/:proofRecordId/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getProofById)),

            async function MultiTenancyController_getProofById(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    proofRecordId: {"in":"path","name":"proofRecordId","required":true,"ref":"RecordId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getProofById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/multi-tenancy/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.deleteTenantById)),

            async function MultiTenancyController_deleteTenantById(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.deleteTenantById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/did/web/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createDidWeb)),

            async function MultiTenancyController_createDidWeb(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    didOptions: {"in":"body","name":"didOptions","required":true,"ref":"DidCreate"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createDidWeb.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/did/key:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.createDidKey)),

            async function MultiTenancyController_createDidKey(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    didOptions: {"in":"body","name":"didOptions","required":true,"ref":"DidCreate"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createDidKey.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/question-answer/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getQuestionAnswerRecords)),

            async function MultiTenancyController_getQuestionAnswerRecords(request: any, response: any, next: any) {
            const args = {
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    connectionId: {"in":"query","name":"connectionId","dataType":"string"},
                    role: {"in":"query","name":"role","ref":"QuestionAnswerRole"},
                    state: {"in":"query","name":"state","ref":"QuestionAnswerState"},
                    threadId: {"in":"query","name":"threadId","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getQuestionAnswerRecords.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/question-answer/question/:connectionId/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.sendQuestion)),

            async function MultiTenancyController_sendQuestion(request: any, response: any, next: any) {
            const args = {
                    connectionId: {"in":"path","name":"connectionId","required":true,"ref":"RecordId"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    config: {"in":"body","name":"config","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"detail":{"dataType":"string"},"validResponses":{"dataType":"array","array":{"dataType":"refObject","ref":"ValidResponse"},"required":true},"question":{"dataType":"string","required":true}}},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.sendQuestion.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/multi-tenancy/question-answer/answer/:id/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.sendAnswer)),

            async function MultiTenancyController_sendAnswer(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"path","name":"id","required":true,"ref":"RecordId"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    request: {"in":"body","name":"request","required":true,"ref":"Record_response.string_"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.sendAnswer.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/multi-tenancy/question-answer/:id/:tenantId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController)),
            ...(fetchMiddlewares<RequestHandler>(MultiTenancyController.prototype.getQuestionAnswerRecordById)),

            async function MultiTenancyController_getQuestionAnswerRecordById(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"path","name":"id","required":true,"ref":"RecordId"},
                    tenantId: {"in":"path","name":"tenantId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<MultiTenancyController>(MultiTenancyController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getQuestionAnswerRecordById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/transactions/endorse',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EndorserTransactionController)),
            ...(fetchMiddlewares<RequestHandler>(EndorserTransactionController.prototype.endorserTransaction)),

            async function EndorserTransactionController_endorserTransaction(request: any, response: any, next: any) {
            const args = {
                    endorserTransaction: {"in":"body","name":"endorserTransaction","required":true,"ref":"EndorserTransaction"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    forbiddenError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<EndorserTransactionController>(EndorserTransactionController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.endorserTransaction.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/transactions/set-endorser-role',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EndorserTransactionController)),
            ...(fetchMiddlewares<RequestHandler>(EndorserTransactionController.prototype.didNymTransaction)),

            async function EndorserTransactionController_didNymTransaction(request: any, response: any, next: any) {
            const args = {
                    didNymTransaction: {"in":"body","name":"didNymTransaction","required":true,"ref":"DidNymTransaction"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<EndorserTransactionController>(EndorserTransactionController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.didNymTransaction.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/transactions/write',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EndorserTransactionController)),
            ...(fetchMiddlewares<RequestHandler>(EndorserTransactionController.prototype.writeSchemaAndCredDefOnLedger)),

            async function EndorserTransactionController_writeSchemaAndCredDefOnLedger(request: any, response: any, next: any) {
            const args = {
                    forbiddenError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    writeTransaction: {"in":"body","name":"writeTransaction","required":true,"ref":"WriteTransaction"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<EndorserTransactionController>(EndorserTransactionController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.writeSchemaAndCredDefOnLedger.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/dids/:did',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DidController)),
            ...(fetchMiddlewares<RequestHandler>(DidController.prototype.getDidRecordByDid)),

            async function DidController_getDidRecordByDid(request: any, response: any, next: any) {
            const args = {
                    did: {"in":"path","name":"did","required":true,"ref":"Did"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<DidController>(DidController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getDidRecordByDid.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/dids/write',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DidController)),
            ...(fetchMiddlewares<RequestHandler>(DidController.prototype.writeDid)),

            async function DidController_writeDid(request: any, response: any, next: any) {
            const args = {
                    createDidOptions: {"in":"body","name":"createDidOptions","required":true,"ref":"DidCreate"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<DidController>(DidController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.writeDid.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/dids',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DidController)),
            ...(fetchMiddlewares<RequestHandler>(DidController.prototype.getDids)),

            async function DidController_getDids(request: any, response: any, next: any) {
            const args = {
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<DidController>(DidController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getDids.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/schemas/:schemaId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SchemaController)),
            ...(fetchMiddlewares<RequestHandler>(SchemaController.prototype.getSchemaById)),

            async function SchemaController_getSchemaById(request: any, response: any, next: any) {
            const args = {
                    schemaId: {"in":"path","name":"schemaId","required":true,"ref":"SchemaId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    forbiddenError: {"in":"res","name":"403","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    badRequestError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<SchemaController>(SchemaController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getSchemaById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/schemas',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SchemaController)),
            ...(fetchMiddlewares<RequestHandler>(SchemaController.prototype.createSchema)),

            async function SchemaController_createSchema(request: any, response: any, next: any) {
            const args = {
                    schema: {"in":"body","name":"schema","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"endorserDid":{"dataType":"string"},"endorse":{"dataType":"boolean"},"attributes":{"dataType":"array","array":{"dataType":"string"},"required":true},"version":{"ref":"Version","required":true},"name":{"dataType":"string","required":true},"issuerId":{"dataType":"string","required":true}}},
                    forbiddenError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<SchemaController>(SchemaController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createSchema.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/credential-definitions/:credentialDefinitionId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialDefinitionController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialDefinitionController.prototype.getCredentialDefinitionById)),

            async function CredentialDefinitionController_getCredentialDefinitionById(request: any, response: any, next: any) {
            const args = {
                    credentialDefinitionId: {"in":"path","name":"credentialDefinitionId","required":true,"ref":"CredentialDefinitionId"},
                    badRequestError: {"in":"res","name":"400","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialDefinitionController>(CredentialDefinitionController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getCredentialDefinitionById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/credential-definitions',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialDefinitionController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialDefinitionController.prototype.createCredentialDefinition)),

            async function CredentialDefinitionController_createCredentialDefinition(request: any, response: any, next: any) {
            const args = {
                    credentialDefinitionRequest: {"in":"body","name":"credentialDefinitionRequest","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"endorserDid":{"dataType":"string"},"endorse":{"dataType":"boolean"},"tag":{"dataType":"string","required":true},"schemaId":{"ref":"SchemaId","required":true},"issuerId":{"dataType":"string","required":true}}},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialDefinitionController>(CredentialDefinitionController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createCredentialDefinition.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/credentials',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialController.prototype.getAllCredentials)),

            async function CredentialController_getAllCredentials(request: any, response: any, next: any) {
            const args = {
                    threadId: {"in":"query","name":"threadId","dataType":"string"},
                    connectionId: {"in":"query","name":"connectionId","dataType":"string"},
                    state: {"in":"query","name":"state","ref":"CredentialState"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialController>(CredentialController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getAllCredentials.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/credentials/w3c',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialController.prototype.getAllW3c)),

            async function CredentialController_getAllW3c(request: any, response: any, next: any) {
            const args = {
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialController>(CredentialController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getAllW3c.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/credentials/w3c/:id',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialController.prototype.getW3cById)),

            async function CredentialController_getW3cById(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"path","name":"id","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialController>(CredentialController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getW3cById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/credentials/:credentialRecordId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialController.prototype.getCredentialById)),

            async function CredentialController_getCredentialById(request: any, response: any, next: any) {
            const args = {
                    credentialRecordId: {"in":"path","name":"credentialRecordId","required":true,"ref":"RecordId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialController>(CredentialController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getCredentialById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/credentials/propose-credential',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialController.prototype.proposeCredential)),

            async function CredentialController_proposeCredential(request: any, response: any, next: any) {
            const args = {
                    proposeCredentialOptions: {"in":"body","name":"proposeCredentialOptions","required":true,"ref":"ProposeCredentialOptions"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialController>(CredentialController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.proposeCredential.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/credentials/accept-proposal',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialController.prototype.acceptProposal)),

            async function CredentialController_acceptProposal(request: any, response: any, next: any) {
            const args = {
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    acceptCredentialProposal: {"in":"body","name":"acceptCredentialProposal","required":true,"ref":"AcceptCredentialProposalOptions"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialController>(CredentialController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptProposal.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/credentials/create-offer',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialController.prototype.createOffer)),

            async function CredentialController_createOffer(request: any, response: any, next: any) {
            const args = {
                    createOfferOptions: {"in":"body","name":"createOfferOptions","required":true,"ref":"CreateOfferOptions"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialController>(CredentialController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createOffer.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/credentials/create-offer-oob',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialController.prototype.createOfferOob)),

            async function CredentialController_createOfferOob(request: any, response: any, next: any) {
            const args = {
                    outOfBandOption: {"in":"body","name":"outOfBandOption","required":true,"ref":"CreateOfferOobOptions"},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialController>(CredentialController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.createOfferOob.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/credentials/accept-offer',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialController.prototype.acceptOffer)),

            async function CredentialController_acceptOffer(request: any, response: any, next: any) {
            const args = {
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    acceptCredentialOfferOptions: {"in":"body","name":"acceptCredentialOfferOptions","required":true,"ref":"CredentialOfferOptions"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialController>(CredentialController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptOffer.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/credentials/accept-request',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialController.prototype.acceptRequest)),

            async function CredentialController_acceptRequest(request: any, response: any, next: any) {
            const args = {
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    acceptCredentialRequestOptions: {"in":"body","name":"acceptCredentialRequestOptions","required":true,"ref":"AcceptCredentialRequestOptions"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialController>(CredentialController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptRequest.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/credentials/accept-credential',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CredentialController)),
            ...(fetchMiddlewares<RequestHandler>(CredentialController.prototype.acceptCredential)),

            async function CredentialController_acceptCredential(request: any, response: any, next: any) {
            const args = {
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
                    acceptCredential: {"in":"body","name":"acceptCredential","required":true,"ref":"AcceptCredential"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<CredentialController>(CredentialController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptCredential.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/connections',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ConnectionController)),
            ...(fetchMiddlewares<RequestHandler>(ConnectionController.prototype.getAllConnections)),

            async function ConnectionController_getAllConnections(request: any, response: any, next: any) {
            const args = {
                    outOfBandId: {"in":"query","name":"outOfBandId","dataType":"string"},
                    alias: {"in":"query","name":"alias","dataType":"string"},
                    state: {"in":"query","name":"state","ref":"DidExchangeState"},
                    myDid: {"in":"query","name":"myDid","dataType":"string"},
                    theirDid: {"in":"query","name":"theirDid","dataType":"string"},
                    theirLabel: {"in":"query","name":"theirLabel","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ConnectionController>(ConnectionController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getAllConnections.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/connections/:connectionId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ConnectionController)),
            ...(fetchMiddlewares<RequestHandler>(ConnectionController.prototype.getConnectionById)),

            async function ConnectionController_getConnectionById(request: any, response: any, next: any) {
            const args = {
                    connectionId: {"in":"path","name":"connectionId","required":true,"ref":"RecordId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ConnectionController>(ConnectionController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getConnectionById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/connections/:connectionId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ConnectionController)),
            ...(fetchMiddlewares<RequestHandler>(ConnectionController.prototype.deleteConnection)),

            async function ConnectionController_deleteConnection(request: any, response: any, next: any) {
            const args = {
                    connectionId: {"in":"path","name":"connectionId","required":true,"ref":"RecordId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ConnectionController>(ConnectionController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.deleteConnection.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/connections/:connectionId/accept-request',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ConnectionController)),
            ...(fetchMiddlewares<RequestHandler>(ConnectionController.prototype.acceptRequest)),

            async function ConnectionController_acceptRequest(request: any, response: any, next: any) {
            const args = {
                    connectionId: {"in":"path","name":"connectionId","required":true,"ref":"RecordId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ConnectionController>(ConnectionController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptRequest.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/connections/:connectionId/accept-response',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ConnectionController)),
            ...(fetchMiddlewares<RequestHandler>(ConnectionController.prototype.acceptResponse)),

            async function ConnectionController_acceptResponse(request: any, response: any, next: any) {
            const args = {
                    connectionId: {"in":"path","name":"connectionId","required":true,"ref":"RecordId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ConnectionController>(ConnectionController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.acceptResponse.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/url/:invitationId',
            ...(fetchMiddlewares<RequestHandler>(ConnectionController)),
            ...(fetchMiddlewares<RequestHandler>(ConnectionController.prototype.getInvitation)),

            async function ConnectionController_getInvitation(request: any, response: any, next: any) {
            const args = {
                    invitationId: {"in":"path","name":"invitationId","required":true,"dataType":"string"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<ConnectionController>(ConnectionController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getInvitation.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/basic-messages/:connectionId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BasicMessageController)),
            ...(fetchMiddlewares<RequestHandler>(BasicMessageController.prototype.getBasicMessages)),

            async function BasicMessageController_getBasicMessages(request: any, response: any, next: any) {
            const args = {
                    connectionId: {"in":"path","name":"connectionId","required":true,"ref":"RecordId"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<BasicMessageController>(BasicMessageController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getBasicMessages.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/basic-messages/:connectionId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BasicMessageController)),
            ...(fetchMiddlewares<RequestHandler>(BasicMessageController.prototype.sendMessage)),

            async function BasicMessageController_sendMessage(request: any, response: any, next: any) {
            const args = {
                    connectionId: {"in":"path","name":"connectionId","required":true,"ref":"RecordId"},
                    request: {"in":"body","name":"request","required":true,"ref":"Record_content.string_"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<BasicMessageController>(BasicMessageController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.sendMessage.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/agent',
            ...(fetchMiddlewares<RequestHandler>(AgentController)),
            ...(fetchMiddlewares<RequestHandler>(AgentController.prototype.getAgentInfo)),

            async function AgentController_getAgentInfo(request: any, response: any, next: any) {
            const args = {
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<AgentController>(AgentController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getAgentInfo.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/agent/wallet',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AgentController)),
            ...(fetchMiddlewares<RequestHandler>(AgentController.prototype.deleteWallet)),

            async function AgentController_deleteWallet(request: any, response: any, next: any) {
            const args = {
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<AgentController>(AgentController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.deleteWallet.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/question-answer',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(QuestionAnswerController)),
            ...(fetchMiddlewares<RequestHandler>(QuestionAnswerController.prototype.getQuestionAnswerRecords)),

            async function QuestionAnswerController_getQuestionAnswerRecords(request: any, response: any, next: any) {
            const args = {
                    connectionId: {"in":"query","name":"connectionId","dataType":"string"},
                    role: {"in":"query","name":"role","ref":"QuestionAnswerRole"},
                    state: {"in":"query","name":"state","ref":"QuestionAnswerState"},
                    threadId: {"in":"query","name":"threadId","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<QuestionAnswerController>(QuestionAnswerController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getQuestionAnswerRecords.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/question-answer/question/:connectionId',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(QuestionAnswerController)),
            ...(fetchMiddlewares<RequestHandler>(QuestionAnswerController.prototype.sendQuestion)),

            async function QuestionAnswerController_sendQuestion(request: any, response: any, next: any) {
            const args = {
                    connectionId: {"in":"path","name":"connectionId","required":true,"ref":"RecordId"},
                    config: {"in":"body","name":"config","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"detail":{"dataType":"string"},"validResponses":{"dataType":"array","array":{"dataType":"refObject","ref":"ValidResponse"},"required":true},"question":{"dataType":"string","required":true}}},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<QuestionAnswerController>(QuestionAnswerController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.sendQuestion.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/question-answer/answer/:id',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(QuestionAnswerController)),
            ...(fetchMiddlewares<RequestHandler>(QuestionAnswerController.prototype.sendAnswer)),

            async function QuestionAnswerController_sendAnswer(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"path","name":"id","required":true,"ref":"RecordId"},
                    request: {"in":"body","name":"request","required":true,"ref":"Record_response.string_"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
                    internalServerError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<QuestionAnswerController>(QuestionAnswerController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.sendAnswer.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/question-answer/:id',
            authenticateMiddleware([{"apiKey":[]}]),
            ...(fetchMiddlewares<RequestHandler>(QuestionAnswerController)),
            ...(fetchMiddlewares<RequestHandler>(QuestionAnswerController.prototype.getQuestionAnswerRecordById)),

            async function QuestionAnswerController_getQuestionAnswerRecordById(request: any, response: any, next: any) {
            const args = {
                    id: {"in":"path","name":"id","required":true,"ref":"RecordId"},
                    notFoundError: {"in":"res","name":"404","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"reason":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<QuestionAnswerController>(QuestionAnswerController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getQuestionAnswerRecordById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, _response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthentication(request, name, secMethod[name])
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthentication(request, name, secMethod[name])
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);
                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function isController(object: any): object is Controller {
        return 'getHeaders' in object && 'getStatus' in object && 'setStatus' in object;
    }

    function promiseHandler(controllerObj: any, promise: any, response: any, successStatus: any, next: any) {
        return Promise.resolve(promise)
            .then((data: any) => {
                let statusCode = successStatus;
                let headers;
                if (isController(controllerObj)) {
                    headers = controllerObj.getHeaders();
                    statusCode = controllerObj.getStatus() || statusCode;
                }

                // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                returnHandler(response, statusCode, data, headers)
            })
            .catch((error: any) => next(error));
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function returnHandler(response: any, statusCode?: number, data?: any, headers: any = {}) {
        if (response.headersSent) {
            return;
        }
        Object.keys(headers).forEach((name: string) => {
            response.set(name, headers[name]);
        });
        if (data && typeof data.pipe === 'function' && data.readable && typeof data._read === 'function') {
            response.status(statusCode || 200)
            data.pipe(response);
        } else if (data !== null && data !== undefined) {
            response.status(statusCode || 200).json(data);
        } else {
            response.status(statusCode || 204).end();
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function responder(response: any): TsoaResponse<HttpStatusCodeLiteral, unknown>  {
        return function(status, data, headers) {
            returnHandler(response, status, data, headers);
        };
    };

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function getValidatedArgs(args: any, request: any, response: any): any[] {
        const fieldErrors: FieldErrors  = {};
        const values = Object.keys(args).map((key) => {
            const name = args[key].name;
            switch (args[key].in) {
                case 'request':
                    return request;
                case 'query':
                    return validationService.ValidateParam(args[key], request.query[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'queries':
                    return validationService.ValidateParam(args[key], request.query, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'path':
                    return validationService.ValidateParam(args[key], request.params[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'header':
                    return validationService.ValidateParam(args[key], request.header(name), name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'body':
                    return validationService.ValidateParam(args[key], request.body, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'body-prop':
                    return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, 'body.', {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'formData':
                    if (args[key].dataType === 'file') {
                        return validationService.ValidateParam(args[key], request.file, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    } else if (args[key].dataType === 'array' && args[key].array.dataType === 'file') {
                        return validationService.ValidateParam(args[key], request.files, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    } else {
                        return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    }
                case 'res':
                    return responder(response);
            }
        });

        if (Object.keys(fieldErrors).length > 0) {
            throw new ValidateError(fieldErrors, '');
        }
        return values;
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
