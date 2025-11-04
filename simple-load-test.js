// Simple Load Test - Start Small and Scale Up
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

class SimpleLoadTester {
  constructor() {
    this.results = [];
  }

  async singleOrderTest() {
    console.log('🧪 Testing single order...');
    
    const order = {
      client_id: 'test-client',
      instrument: 'BTC-USD',
      side: 'buy',
      type: 'limit',
      price: 70000,
      quantity: 0.01
    };

    const startTime = Date.now();
    
    try {
      const response = await axios.post(`${BASE_URL}/orders`, order, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      const latency = Date.now() - startTime;
      console.log(`✅ Single order SUCCESS - ${latency}ms latency`);
      return { success: true, latency, orderId: response.data.order.order_id };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.log(`❌ Single order FAILED - ${error.message} (${latency}ms)`);
      return { success: false, latency, error: error.message };
    }
  }

  async sequentialTest(numOrders = 10) {
    console.log(`\n🔄 Testing ${numOrders} sequential orders...`);
    
    const results = [];
    const startTime = Date.now();
    
    for (let i = 0; i < numOrders; i++) {
      const order = {
        client_id: `seq-client-${i}`,
        instrument: 'BTC-USD',
        side: i % 2 === 0 ? 'buy' : 'sell',
        type: 'limit',
        price: 70000 + Math.random() * 100 - 50,
        quantity: 0.01
      };

      const orderStart = Date.now();
      
      try {
        await axios.post(`${BASE_URL}/orders`, order, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        
        const latency = Date.now() - orderStart;
        results.push({ success: true, latency });
        process.stdout.write(`✅ `);
      } catch (error) {
        const latency = Date.now() - orderStart;
        results.push({ success: false, latency, error: error.message });
        process.stdout.write(`❌ `);
      }
    }
    
    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const avgLatency = results.filter(r => r.success).reduce((sum, r) => sum + r.latency, 0) / successful;
    
    console.log(`\n📊 Sequential Test Results:`);
    console.log(`   Duration: ${totalTime}ms`);
    console.log(`   Success: ${successful}/${numOrders} (${(successful/numOrders*100).toFixed(1)}%)`);
    console.log(`   Avg Latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`   Orders/sec: ${(numOrders / (totalTime / 1000)).toFixed(1)}`);
    
    return results;
  }

  async concurrentTest(numOrders = 10) {
    console.log(`\n⚡ Testing ${numOrders} concurrent orders...`);
    
    const orderPromises = [];
    const startTime = Date.now();
    
    for (let i = 0; i < numOrders; i++) {
      const order = {
        client_id: `conc-client-${i}`,
        instrument: 'BTC-USD',
        side: i % 2 === 0 ? 'buy' : 'sell',
        type: 'limit',
        price: 70000 + Math.random() * 100 - 50,
        quantity: 0.01
      };

      const orderPromise = axios.post(`${BASE_URL}/orders`, order, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }).then(response => {
        return { success: true, latency: Date.now() - startTime, orderId: response.data.order.order_id };
      }).catch(error => {
        return { success: false, latency: Date.now() - startTime, error: error.message };
      });
      
      orderPromises.push(orderPromise);
    }
    
    const results = await Promise.all(orderPromises);
    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const avgLatency = results.filter(r => r.success).reduce((sum, r) => sum + r.latency, 0) / successful;
    
    console.log(`📊 Concurrent Test Results:`);
    console.log(`   Duration: ${totalTime}ms`);
    console.log(`   Success: ${successful}/${numOrders} (${(successful/numOrders*100).toFixed(1)}%)`);
    console.log(`   Avg Latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`   Orders/sec: ${(numOrders / (totalTime / 1000)).toFixed(1)}`);
    
    return results;
  }

  async runGradualTest() {
    console.log('🚀 Starting Gradual Load Test...\n');
    
    // Test 1: Single order
    await this.singleOrderTest();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Sequential orders
    await this.sequentialTest(10);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Small concurrent batch
    await this.concurrentTest(5);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Larger concurrent batch
    await this.concurrentTest(20);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 5: Even larger if previous tests work
    await this.concurrentTest(50);
    
    console.log('\n✅ Gradual load test completed!');
  }
}

// Run the gradual load test
const tester = new SimpleLoadTester();
tester.runGradualTest().catch(console.error);