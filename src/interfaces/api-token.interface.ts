export interface TokensDB {
    type_token: string,
    body: string
}

// export interface ApiTokenDB extends TokensDB {
//     body: ApiToken
// }

export interface ApiToken {
    token: string,
    data_create: Date
}
