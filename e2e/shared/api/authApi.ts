import axios from 'axios';
import { smokeConfig } from '../config/smokeConfig';

const isSmokeDebugEnabled = process.env.SMOKE_DEBUG === 'true';

export interface AuthResult {
  userId: string;
  token?: string;
  driverId?: string;
  passengerId?: string;
}

export async function loginDriver(): Promise<AuthResult> {
  let res;
  try {
    res = await axios.post(`${smokeConfig.apiUrl}/auth/login`, {
      email: smokeConfig.driverEmail,
      password: smokeConfig.driverPassword,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `POST /auth/login (driver) failed with status ${error.response?.status ?? 'unknown'}: ` +
          JSON.stringify(error.response?.data ?? {}),
      );
    }
    throw error;
  }
  if (isSmokeDebugEnabled) {
    console.log('SMOKE DEBUG loginDriver response', {
      userId: res.data?.user?.id,
      driverId: res.data?.driverId,
      hasToken: Boolean(res.data?.token),
    });
  }
  return {
    userId: res.data.user.id,
    driverId: res.data.driverId,
    token: res.data.token,
  };
}

export async function loginPassenger(): Promise<AuthResult> {
  let res;
  try {
    res = await axios.post(`${smokeConfig.apiUrl}/auth/login`, {
      email: smokeConfig.passengerEmail,
      password: smokeConfig.passengerPassword,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `POST /auth/login (passenger) failed with status ${error.response?.status ?? 'unknown'}: ` +
          JSON.stringify(error.response?.data ?? {}),
      );
    }
    throw error;
  }
  if (isSmokeDebugEnabled) {
    console.log('SMOKE DEBUG loginPassenger response', {
      userId: res.data?.user?.id,
      passengerId: res.data?.passengerId,
      hasToken: Boolean(res.data?.token),
    });
  }
  return {
    userId: res.data.user.id,
    passengerId: res.data.passengerId,
    token: res.data.token,
  };
}
