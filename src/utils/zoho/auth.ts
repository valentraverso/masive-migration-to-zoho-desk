import FormData from "form-data";
import {
  ZOHO_ACCOUNTS_URL,
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_REFRESH_TOKEN,
} from "../../config/config";
import { ZohoOAuthResponse } from "../../interfaces/zoho.interface";
import { tokenManagement } from "./tokens";
import { TokensDB } from "../../interfaces/api-token.interface";
import fetch from "node-fetch";

/**
 * Clase para la gestión de la autenticación con Zoho.
 * Para poder realizar la autenticación es necesario haber generado el access token y el refresh token en la consola de zoho https://api-console.zoho.com.
 */
class ZohoAuth {
  private options = { responseType: "json" };
  private limit = 5;

  /**
   * Generar el Access Token a través del Refresh Token.
   */
  async generateAccessToken() {
    const formData = new FormData();
    formData.append("client_id", ZOHO_CLIENT_ID);
    formData.append("client_secret", ZOHO_CLIENT_SECRET);
    formData.append("refresh_token", ZOHO_REFRESH_TOKEN);
    formData.append("grant_type", "refresh_token");

    try {
      const options = {
        method: "POST",
        body: formData,
      };
      const call: any = await fetch(
        `${ZOHO_ACCOUNTS_URL}/oauth/v2/token`,
        options
      );

      const _response = await call.json();

      if ("error" in _response) {
        console.log("Error Zoho OAuth response");
      } else {
        _response.expires_in = new Date(
          Date.now() + _response.expires_in * 1000
        ).getTime();
        const insert: TokensDB = {
          type_token: "zohotoken",
          body: _response,
        };
        // Borramos el token actual y guardamos el nuevo
        await tokenManagement.deleteTokenDB("zohotoken");
        if (!(await tokenManagement.saveTokenDB(insert))) {
          console.log("Error Generate Access Token Zoho");
        }
      }
    } catch (_error: any) {
      const error = _error;
      console.log("Error Generate Access Token Zoho");
      console.log(error);
    }
  }

  /**
   * Recupera el token actual de Zoho. Si está caducado genera uno nuevo.
   * @param count
   * @returns {string|null} Retorna el token si existe y lo puede generar, en caso contrario retorna null.
   */
  async getAccessToken(count = 1): Promise<string | null> {
    const response: any[] = await tokenManagement.getTokenDB("zohotoken");
    let dataToken: any = null;
    if (response.length > 0) {
      const data: ZohoOAuthResponse = response[0].body;
      dataToken = data.expires_in > Date.now() ? data : null;
    }

    if (dataToken !== null) {
      const token: ZohoOAuthResponse = dataToken;
      return token.access_token;
    } else if (count <= this.limit) {
      await this.generateAccessToken();
      return this.getAccessToken(++count);
    } else {
      return null;
    }
  }
}

export default new ZohoAuth();
