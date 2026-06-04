import { loginDriver, loginPassenger } from '../api/authApi';

export interface SmokeContext {
  driverId: string;
  passengerId: string;
  driverToken?: string;
  passengerToken?: string;
  rootDriverId?: string;
}

export async function createSmokeContext(): Promise<SmokeContext> {
  const driver = await loginDriver();
  const passenger = await loginPassenger();
  return {
    driverId: driver.driverId!,
    passengerId: passenger.passengerId!,
    driverToken: driver.token,
    passengerToken: passenger.token,
  };
}
