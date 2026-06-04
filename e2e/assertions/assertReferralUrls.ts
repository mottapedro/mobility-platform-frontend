import { expect } from '@playwright/test';
import { getInviteUrls } from '../shared/api/networkApi';
import { SmokeContext } from '../shared/context/smokeContext';

function validateUrl(label: string, url: string | undefined | null) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    console.log(`✗ ${label} missing`);
    return false;
  }
  // Formato mínimo: deve conter slug/token/código
  if (!/invite|[a-z0-9]{6,}/i.test(url)) {
    console.log(`✗ ${label} inválida: ${url}`);
    return false;
  }
  console.log(`✓ ${label}`);
  return true;
}

export async function assertReferralUrls(ctx: SmokeContext) {
  const urls = await getInviteUrls(ctx);
  // Validação de presença e formato
  const d2dOk = validateUrl('driverToDriver', urls.driverToDriver);
  const d2pOk = validateUrl('driverToPassenger', urls.driverToPassenger);
  const p2pPresent = Boolean(urls.passengerToPassenger && String(urls.passengerToPassenger).trim());
  const p2pOk = p2pPresent ? validateUrl('passengerToPassenger', urls.passengerToPassenger) : true;

  // Diagnóstico
  console.log('\nReferral URLs Audit');
  console.log('-------------------');
  console.log('D2D:', urls.driverToDriver);
  console.log('D2P:', urls.driverToPassenger);
  console.log('P2P:', urls.passengerToPassenger);
  console.log('\nFlow Coverage');
  if (d2dOk) console.log('✓ driverToDriver');
  else console.log('✗ driverToDriver missing');
  if (d2pOk) console.log('✓ driverToPassenger');
  else console.log('✗ driverToPassenger missing');
  if (p2pPresent && p2pOk) console.log('✓ passengerToPassenger');
  else if (p2pPresent) console.log('✗ passengerToPassenger invalid');
  else console.log('• passengerToPassenger not provided for this actor (accepted)');

  // Unicidade
  const presentUrls = [urls.driverToDriver, urls.driverToPassenger, urls.passengerToPassenger]
    .filter((url): url is string => Boolean(url && String(url).trim()));
  const unique = new Set(presentUrls).size === presentUrls.length;
  console.log('\nUniqueness:', unique ? 'PASS' : 'FAIL');
  console.log('-------------------\n');
  // Falha se algum obrigatório ausente ou não único
  expect(d2dOk).toBe(true);
  expect(d2pOk).toBe(true);
  expect(p2pOk).toBe(true);
  expect(unique).toBe(true);
}
