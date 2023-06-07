import type { DidCreateOptions } from '../types';
import { Agent } from '@aries-framework/core';
import { Controller, TsoaResponse } from 'tsoa';
import { Did } from '../examples';
export declare class DidController extends Controller {
    private agent;
    constructor(agent: Agent);
    /**
     * Resolves did and returns did resolution result
     * @param did Decentralized Identifier
     * @returns DidResolutionResult
     */
    getDidRecordByDid(did: Did): Promise<{
        resolveResult: import("@aries-framework/core").DidResolutionResult;
    } | {
        didDocument: Record<string, any>;
        didResolutionMetadata: import("@aries-framework/core").DidResolutionMetadata;
        didDocumentMetadata: import("did-resolver").DIDDocumentMetadata;
        resolveResult?: undefined;
    }>;
    /**
     * Did nym registration
     * @body DidCreateOptions
     * @returns DidResolutionResult
     */
    writeDid(data: DidCreateOptions, internalServerError: TsoaResponse<500, {
        message: string;
    }>): Promise<any>;
}
