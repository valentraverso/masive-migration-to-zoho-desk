import { TokensDB } from "../../interfaces/api-token.interface";
import tokenModel from "../../models/tokens.model";

class TokenManagement {
  protected table = "token";

  /**
   * Guarda el registro del token en la base de datos.
   * @param insert
   * @returns {boolean} Retorna true si no ha habido ningún problema.
   */
  async saveTokenDB(insert: TokensDB): Promise<boolean> {
    try {
      console.group(insert)
      // Guardamos el Token.
      await tokenModel.create(insert);
      return true;
    } catch (error) {
      console.log("Error saveTokenDB");
      console.log(error);
      return false;
    }
  }

  /**
   * Recupera los tokens según el tipo.
   * @param {string} type El tipo de token a recuperar.
   * @returns
   */
  async getTokenDB(type: string): Promise<TokensDB[]> {
    try {
      const result: TokensDB[] = await tokenModel.find({ type_token: type });
      return result;
    } catch (error) {
      console.log("Error Get token DB");
      console.log(error);
      return [];
    }
  }

  /**
   * Borrar un token de la base de datos.
   * @param {string} type El tipo de token a borrar.
   * @returns {boolean} Retorna true si se ha borrado correctamente, false en caso contrario.
   */
  async deleteTokenDB(type: string) {
    try {
      await tokenModel.deleteMany({ type_token: type });
      return true;
    } catch (error) {
      console.log("Error DELETE token DB");
      console.log(error);
      return false;
    }
  }
}

export const tokenManagement = new TokenManagement();
export default TokenManagement;
