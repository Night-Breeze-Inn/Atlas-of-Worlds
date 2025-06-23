export interface JwtPayload {
    sub: string;
    username: string;
    email: string;
    iat?: number;
    exp?: number;
  }
  
  export interface LoginResponse {
    accessToken: string;
  }
  
  export interface LoginDto {
    email: string;
    password: string;
  }