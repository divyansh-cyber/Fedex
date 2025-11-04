// Realistic Performance Test
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

class RealPerformanceTest {
  constructor() {
    this.results = [];
  }

  async testSingleOrders(count = 10) {
    console.log(`🧪 Testing ${count} individual orders (sequential)...`);
    
    const results = [];
    
    for (let i = 0; i < count; i++) {
      const order = {
        client_id: `test-${i}`,
        instrument: 'BTC-USD',
        side: i % 2 === 0 ? 'buy' : 'sell',
        type: 'limit',
        price: 70000 + (Math.random() * 200 - 100),
        quantity: 0.01
      };

      const startTime = Date.now();
      
      try {
        const response = await axios.post(`${BASE_URL}/orders`, order, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
        
        const latency = Date.now() - startTime;
        results.push({ success: true, latency });
        console.log(`Order ${i + 1}: ✅ ${latency}ms`);
        
        // Small delay between orders
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const latency = Date.now() - startTime;
        results.push({ success: false, latency, error: error.message });
        console.log(`Order ${i + 1}: ❌ ${error.message} (${latency}ms)`);
      }
    }
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (successful.length > 0) {
      const avgLatency = successful.reduce((sum, r) => sum + r.latency, 0) / successful.length;
      const minLatency = Math.min(...successful.map(r => r.latency));
      const maxLatency = Math.max(...successful.map(r => r.latency));
      
      console.log(`\n📊 Sequential Test Results:`);
      console.log(`   Success Rate: ${successful.length}/${count} (${(successful.length/count*100).toFixed(1)}%)`);
      console.log(`   Average Latency: ${avgLatency.toFixed(1)}ms`);
      console.log(`   Min Latency: ${minLatency}ms`);
      console.log(`   Max Latency: ${maxLatency}ms`);
    }
    
    if (failed.length > 0) {
      console.log(`\n❌ Failed orders: ${failed.length}`);
      failed.slice(0, 3).forEach((f, i) => {
        console.log(`   ${i + 1}. ${f.error}`);
      });
    }
    
    return results;
  }

  async testConcurrentBatch(batchSize = 5) {
    console.log(`\n⚡ Testing ${batchSize} concurrent orders...`);
    
    const orderPromises = [];
    const batchStartTime = Date.now();
    
    for (let i = 0; i < batchSize; i++) {
      const order = {
        client_id: `batch-${i}`,
        instrument: 'BTC-USD',
        side: i % 2 === 0 ? 'buy' : 'sell',
        type: 'limit',
        price: 70000 + (Math.random() * 200 - 100),
        quantity: 0.01
      };

      const orderStartTime = Date.now();
      
      const orderPromise = axios.post(`${BASE_URL}/orders`, order, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }).then(response => {
        const latency = Date.now() - orderStartTime;
        return { success: true, latency, orderId: response.data.order.order_id };
      }).catch(error => {
        const latency = Date.now() - orderStartTime;
        return { success: false, latency, error: error.message };
      });
      
      orderPromises.push(orderPromise);
    }
    
    const results = await Promise.all(orderPromises);
    const totalTime = Date.now() - batchStartTime;
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`📊 Concurrent Batch Results:`);
    console.log(`   Total Duration: ${totalTime}ms`);
    console.log(`   Success Rate: ${successful.length}/${batchSize} (${(successful.length/batchSize*100).toFixed(1)}%)`);
    
    if (successful.length > 0) {
      const avgLatency = successful.reduce((sum, r) => sum + r.latency, 0) / successful.length;
      const minLatency = Math.min(...successful.map(r => r.latency));
      const maxLatency = Math.max(...successful.map(r => r.latency));
      const throughput = (successful.length / (totalTime / 1000)).toFixed(1);
      
      console.log(`   Average Latency: ${avgLatency.toFixed(1)}ms`);
      console.log(`   Min Latency: ${minLatency}ms`);
      console.log(`   Max Latency: ${maxLatency}ms`);
      console.log(`   Throughput: ${throughput} orders/sec`);
    }
    
    if (failed.length > 0) {
      console.log(`   Failed: ${failed.length} orders`);
    }
    
    return results;
  }

  async runHonestTest() {
    console.log('🎯 HONEST PERFORMANCE TEST\n');
    console.log('Testing actual system performance...\n');
    
    // Test 1: Individual orders with realistic timing
    const sequentialResults = await this.testSingleOrders(10);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Small concurrent batch
    const concurrentResults = await this.testConcurrentBatch(5);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Slightly larger batch if previous worked
    if (concurrentResults.filter(r => r.success).length >= 3) {
      await this.testConcurrentBatch(10);
    }
    
    console.log('\n✅ Honest performance test completed!');
    console.log('\n📋 REALISTIC ASSESSMENT:');
    
    const allSuccessful = [...sequentialResults, ...concurrentResults].filter(r => r.success);
    if (allSuccessful.length > 0) {
      const overallAvgLatency = allSuccessful.reduce((sum, r) => sum + r.latency, 0) / allSuccessful.length;
      console.log(`   Real Average Latency: ${overallAvgLatency.toFixed(1)}ms`);
      console.log(`   Estimated Max Throughput: ~${(1000 / overallAvgLatency).toFixed(0)} orders/sec per connection`);
      console.log(`   Success Rate: ${((allSuccessful.length / (sequentialResults.length + concurrentResults.length)) * 100).toFixed(1)}%`);
    }
  }
}

// Run the honest test
const tester = new RealPerformanceTest();
tester.runHonestTest().catch(console.error);