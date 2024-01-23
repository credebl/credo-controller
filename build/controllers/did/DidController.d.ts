import { Agent } from '@aries-framework/core';
import { Did } from '../examples';
import { DidCreate } from '../types';
import { Controller, TsoaResponse } from 'tsoa';
export declare class DidController extends Controller {
    private agent;
    constructor(agent: Agent);
    /**
     * Resolves did and returns did resolution result
     * @param did Decentralized Identifier
     * @returns DidResolutionResult
     */
    getDidRecordByDid(did: Did): Promise<{
        importDid: void;
    } | {
        didDocument: Record<string, any>;
        didResolutionMetadata: import("@aries-framework/core").DidResolutionMetadata;
        didDocumentMetadata: import("did-resolver").DIDDocumentMetadata;
        importDid?: undefined;
    }>;
    /**
     * Did nym registration
     * @body DidCreateOptions
     * @returns DidResolutionResult
     */
    writeDid(data: DidCreate, internalServerError: TsoaResponse<500, {
        message: string;
    }>): Promise<any>;
    private handleBcovrin;
    private handleIndicio;
    private createEndorserDid;
    private createIndicioKey;
    private importDid;
    createDidKey(didOptions: DidCreate, internalServerError: TsoaResponse<500, {
        message: string;
    }>): Promise<any>;
    createDidWeb(didOptions: DidCreate, internalServerError: TsoaResponse<500, {
        message: string;
    }>): Promise<any>;
    getDids(): Promise<import("@aries-framework/core").DidRecord[]>;
}
