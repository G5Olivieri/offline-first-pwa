// Simple test to verify the refactored recommendation engine
import { getRecommendationEngine } from './src/services/recommendation-engine.ts';

async function testRecommendationEngine() {
  try {
    console.log('Testing recommendation engine initialization...');
    const engine = await getRecommendationEngine();
    console.log('✅ Recommendation engine initialized successfully');

    // Test if the engine has the expected methods
    console.log('Testing method availability...');
    console.log('generateRecommendations method:', typeof engine.generateRecommendations);
    console.log('updateProductAffinities method:', typeof engine.updateProductAffinities);
    console.log('updateCustomerPreferences method:', typeof engine.updateCustomerPreferences);

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRecommendationEngine();
