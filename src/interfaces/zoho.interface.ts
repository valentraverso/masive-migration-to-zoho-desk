import { TokensDB } from './api-token.interface';

export interface ZohoOAuthResponse {
    access_token: string,
    api_domain: string,
    token_type: string,
    expires_in: number
}

export interface ZohoRecordsResponse {
    data: { [key:string]: any} [];
    info: {
        per_page: number,
        next_page_token: string,
        count: number,
        page: number,
        previous_page_token: string,
        page_token_expiry: Date,
        more_records: boolean
    }
}

export interface ZohoErrorDetailResponse {
    expected_data_type: string,
    api_name: string,
    json_path: string,
}

export interface ZohoSuccessDetailResponse {
    Modified_Time: string,
    Modified_By: string,
    Created_Time: string,
    id: string,
    Created_By: string
}

export interface ZohoDataBaseResponse {
    code: string,
    details: ZohoErrorDetailResponse|ZohoSuccessDetailResponse,
    message: string,
    status: string
}

export interface ZohoDataUpsertResponse extends ZohoDataBaseResponse {
    duplicate_field: string,
    action: string
}

export interface ZohoPostRecordsReponse {
    data: ZohoDataBaseResponse[]
}

export interface ZohoUpsertRecordsReponse {
    data: ZohoDataUpsertResponse[]
}

export interface ZohoAccessTokenDB {
    type_token: string,
    body: ZohoOAuthResponse
}

export interface ZohoRecordUpsert {
    data: any[],
    duplicate_check_fields: string[],
    trigger?: string[]
}

export interface ZohoSaveRecordId {
    module: string,
    id_zoho: string,
    id_xsinfo: string
}

export interface ZohoRecordInsert {
    data: any[],
    trigger?: string[]
}
