declare module '@thetalabs/theta-pass' {
  export interface ThetaPassResponse {
    request: any;
    result: string[];
  }

  export interface ThetaPassRequestResponse {
    request: any;
    result: string[];
  }

  export function requestAccounts(
    redirectUrl: string,
    options: any,
    usePopup: boolean
  ): Promise<ThetaPassRequestResponse>;

  export function signMessage(
    message: string,
    redirectUrl: string,
    options: any,
    usePopup: boolean
  ): Promise<ThetaPassResponse>;

  export function getResponse(): Promise<ThetaPassResponse>;

  export const THETA_DROP_NFT_ABI: any[];
}
