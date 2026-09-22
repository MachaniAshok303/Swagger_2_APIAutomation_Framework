import { TokenManager } from '../src/utils/tokenManager';

async function main() {
  console.log('🔑 Requesting access token using TokenManager...');
  const token = await TokenManager.getAccessToken();
  console.log(`✅ Access Token Acquired: ${token.substring(0, 30)}...`);
}

main().catch(console.error);
