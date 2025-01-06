export interface ThreeDSecureResponse {
    status: '3D_SUCCESS' | '3D_ERROR' | '3D_PENDING';
    redirectUrl?: string;
    md?: string;
    xid?: string;
    eci?: string;
    cavv?: string;
    errorCode?: string;
    errorMessage?: string;
    clientId?: string;
    oid?: string;
    amount?: string;
    okUrl?: string;
    failUrl?: string;
    rnd?: string;
    hash?: string;
    storetype?: string;
    lang?: string;
} 