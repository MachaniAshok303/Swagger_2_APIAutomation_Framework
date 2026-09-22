import { DataGenerator } from '../src/utils/dataGenerator';
import { RandomUtils } from '../src/utils/randomUtils';

async function main() {
  console.log('🧪 Synthesizing mock test datasets...');
  const dataset = {
    userId: RandomUtils.randomNumber(100, 999),
    userName: DataGenerator.randomString('user'),
    userEmail: DataGenerator.randomEmail()
  };
  console.log('✅ Generated Sample Data:', JSON.stringify(dataset, null, 2));
}

main().catch(console.error);
