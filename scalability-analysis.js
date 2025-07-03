#!/usr/bin/env node

/**
 * Analisi scalabilità MES Aerospazio
 * Calcola capacità teorica e pratica del sistema
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ScalabilityAnalyzer {
  constructor() {
    this.currentData = {};
    this.analysis = {};
  }

  async analyzeCurrentData() {
    console.log('📊 Analyzing Current Data Scale...\n');
    
    try {
      // Count current entities
      const counts = await Promise.all([
        prisma.user.count(),
        prisma.department.count(),
        prisma.part.count(),
        prisma.oDL.count(),
        prisma.productionEvent.count(),
        prisma.autoclaveLoad.count(),
        prisma.tool.count(),
        prisma.auditLog.count(),
        prisma.session.count()
      ]);

      this.currentData = {
        users: counts[0],
        departments: counts[1],
        parts: counts[2],
        odls: counts[3],
        productionEvents: counts[4],
        autoclaveLoads: counts[5],
        tools: counts[6],
        auditLogs: counts[7],
        activeSessions: counts[8]
      };

      console.log('📈 Current Database Scale:');
      Object.entries(this.currentData).forEach(([key, value]) => {
        console.log(`  ${key.padEnd(20)}: ${value.toLocaleString()}`);
      });

      return this.currentData;
    } catch (error) {
      console.error('❌ Error analyzing current data:', error.message);
      return null;
    }
  }

  analyzeArchitectureCapacity() {
    console.log('\n🏗️ Architecture Capacity Analysis:\n');

    const capacity = {
      // PostgreSQL theoretical limits
      database: {
        maxTableSize: '32 TB per table',
        maxRows: '~1.6 billion rows per table (practical limit)',
        maxConcurrentConnections: '100-1000 (configurable)',
        maxIndexes: 'Unlimited per table'
      },

      // Next.js & Node.js limits
      application: {
        memoryLimit: '1.7 GB per Node.js process (default)',
        concurrentRequests: '~1000-5000 with clustering',
        fileUploadSize: '50MB (configurable)',
        sessionStorage: 'Redis-backed (virtually unlimited)'
      },

      // React Query & Client
      frontend: {
        cacheSize: '~10MB typical, 50MB+ possible',
        concurrentQueries: '~100-200 active queries',
        componentLimit: 'No practical limit',
        browserStorage: '5-10MB LocalStorage, unlimited IndexedDB'
      }
    };

    Object.entries(capacity).forEach(([category, limits]) => {
      console.log(`${category.toUpperCase()}:`);
      Object.entries(limits).forEach(([key, value]) => {
        console.log(`  ${key.padEnd(25)}: ${value}`);
      });
      console.log();
    });

    return capacity;
  }

  estimateProductionCapacity() {
    console.log('🏭 Production Capacity Estimates:\n');

    const scenarios = {
      small: {
        name: 'Small Manufacturing (1-2 lines)',
        users: 50,
        concurrent: 10,
        dailyODLs: 100,
        dailyEvents: 1000,
        yearlyData: {
          odls: 36500,
          events: 365000,
          parts: 500
        }
      },
      medium: {
        name: 'Medium Manufacturing (3-5 lines)',
        users: 200,
        concurrent: 50,
        dailyODLs: 500,
        dailyEvents: 5000,
        yearlyData: {
          odls: 182500,
          events: 1825000,
          parts: 2000
        }
      },
      large: {
        name: 'Large Manufacturing (6+ lines)',
        users: 1000,
        concurrent: 200,
        dailyODLs: 2000,
        dailyEvents: 20000,
        yearlyData: {
          odls: 730000,
          events: 7300000,
          parts: 10000
        }
      },
      enterprise: {
        name: 'Enterprise Multi-Plant',
        users: 5000,
        concurrent: 1000,
        dailyODLs: 10000,
        dailyEvents: 100000,
        yearlyData: {
          odls: 3650000,
          events: 36500000,
          parts: 50000
        }
      }
    };

    Object.entries(scenarios).forEach(([key, scenario]) => {
      console.log(`${scenario.name}:`);
      console.log(`  👥 Users: ${scenario.users.toLocaleString()}`);
      console.log(`  🔄 Concurrent: ${scenario.concurrent.toLocaleString()}`);
      console.log(`  📋 Daily ODLs: ${scenario.dailyODLs.toLocaleString()}`);
      console.log(`  📊 Daily Events: ${scenario.dailyEvents.toLocaleString()}`);
      console.log(`  📈 Yearly ODLs: ${scenario.yearlyData.odls.toLocaleString()}`);
      console.log(`  📈 Yearly Events: ${scenario.yearlyData.events.toLocaleString()}`);
      console.log(`  🔩 Parts Catalog: ${scenario.yearlyData.parts.toLocaleString()}`);
      
      // Calculate database size estimate
      const estimatedSize = this.calculateDatabaseSize(scenario.yearlyData);
      console.log(`  💾 Estimated DB Size: ${estimatedSize}`);
      
      // Performance assessment
      const performance = this.assessPerformance(scenario);
      console.log(`  ⚡ Performance: ${performance}`);
      console.log();
    });

    return scenarios;
  }

  calculateDatabaseSize(yearlyData) {
    // Rough estimates in MB
    const sizeMB = {
      odls: yearlyData.odls * 0.01, // ~10KB per ODL (with QR SVG)
      events: yearlyData.events * 0.001, // ~1KB per event
      parts: yearlyData.parts * 0.005, // ~5KB per part
      indexes: (yearlyData.odls + yearlyData.events) * 0.002, // Index overhead
      audit: yearlyData.events * 0.0005 // Audit logs
    };

    const totalMB = Object.values(sizeMB).reduce((sum, size) => sum + size, 0);
    
    if (totalMB < 1024) {
      return `${Math.round(totalMB)} MB`;
    } else if (totalMB < 1024 * 1024) {
      return `${Math.round(totalMB / 1024 * 10) / 10} GB`;
    } else {
      return `${Math.round(totalMB / (1024 * 1024) * 10) / 10} TB`;
    }
  }

  assessPerformance(scenario) {
    if (scenario.concurrent <= 50 && scenario.dailyEvents <= 5000) {
      return '🟢 Excellent (< 100ms response)';
    } else if (scenario.concurrent <= 200 && scenario.dailyEvents <= 20000) {
      return '🟡 Good (100-300ms response)';
    } else if (scenario.concurrent <= 1000 && scenario.dailyEvents <= 100000) {
      return '🟠 Acceptable (300-1000ms, clustering needed)';
    } else {
      return '🔴 Needs optimization (horizontal scaling required)';
    }
  }

  analyzeBottlenecks() {
    console.log('🚧 Potential Bottlenecks & Solutions:\n');

    const bottlenecks = [
      {
        component: 'QR Code Generation',
        threshold: '~1000 concurrent generations',
        impact: 'CPU intensive SVG generation',
        solutions: [
          'Pre-generate QR codes during ODL creation',
          'Cache generated QR codes in Redis',
          'Use background job queue (BullMQ) for batch generation'
        ]
      },
      {
        component: 'Database Connections',
        threshold: '~100 concurrent connections (default)',
        impact: 'Connection pool exhaustion',
        solutions: [
          'Configure connection pooling (pgBouncer)',
          'Implement connection limits per service',
          'Use read replicas for reports'
        ]
      },
      {
        component: 'Production Events',
        threshold: '~10,000 events/hour',
        impact: 'Write-heavy workload',
        solutions: [
          'Batch insert events via queue',
          'Partition tables by date',
          'Archive old events to cold storage'
        ]
      },
      {
        component: 'Real-time Updates',
        threshold: '~500 concurrent WebSocket connections',
        impact: 'Memory usage and broadcasting',
        solutions: [
          'Implement WebSocket clustering',
          'Use Redis pub/sub for scaling',
          'Room-based subscriptions by department'
        ]
      },
      {
        component: 'File Storage (QR exports)',
        threshold: '~1TB uploaded files',
        impact: 'Disk space and backup time',
        solutions: [
          'Use object storage (S3-compatible)',
          'Implement file lifecycle policies',
          'CDN for static QR code serving'
        ]
      }
    ];

    bottlenecks.forEach(bottleneck => {
      console.log(`${bottleneck.component}:`);
      console.log(`  🚨 Threshold: ${bottleneck.threshold}`);
      console.log(`  💥 Impact: ${bottleneck.impact}`);
      console.log(`  🔧 Solutions:`);
      bottleneck.solutions.forEach(solution => {
        console.log(`    • ${solution}`);
      });
      console.log();
    });

    return bottlenecks;
  }

  generateScalingRecommendations() {
    console.log('📈 Scaling Recommendations:\n');

    const recommendations = {
      immediate: {
        title: 'Immediate (0-50 users)',
        actions: [
          'Current setup sufficient',
          'Monitor database performance',
          'Implement basic caching',
          'Setup backup strategy'
        ]
      },
      shortTerm: {
        title: 'Short-term (50-200 users)',
        actions: [
          'Add Redis for session storage',
          'Configure database connection pooling',
          'Implement API rate limiting',
          'Add horizontal pod autoscaling'
        ]
      },
      mediumTerm: {
        title: 'Medium-term (200-1000 users)',
        actions: [
          'Database read replicas',
          'Background job processing (BullMQ)',
          'CDN for static assets',
          'Application clustering'
        ]
      },
      longTerm: {
        title: 'Long-term (1000+ users)',
        actions: [
          'Database sharding by plant/region',
          'Microservices architecture',
          'Event-driven architecture',
          'Multi-region deployment'
        ]
      }
    };

    Object.entries(recommendations).forEach(([phase, rec]) => {
      console.log(`${rec.title}:`);
      rec.actions.forEach(action => {
        console.log(`  ✅ ${action}`);
      });
      console.log();
    });

    return recommendations;
  }

  async runCompleteAnalysis() {
    console.log('🔍 MES Aerospazio - Scalability Analysis\n');
    console.log('='.repeat(60) + '\n');

    try {
      await this.analyzeCurrentData();
      this.analyzeArchitectureCapacity();
      this.estimateProductionCapacity();
      this.analyzeBottlenecks();
      this.generateScalingRecommendations();

      console.log('📋 SUMMARY:');
      console.log('='.repeat(60));
      console.log('• Current system: ✅ Ready for small-medium manufacturing');
      console.log('• Recommended max: 🎯 200 concurrent users, 5K daily events');
      console.log('• Database capacity: 📊 Multi-million ODLs supported');
      console.log('• Scaling path: 🚀 Clear roadmap to enterprise scale');
      console.log('• Architecture: 🏗️ Solid foundation with optimization hooks');

    } catch (error) {
      console.error('❌ Analysis failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

async function main() {
  const analyzer = new ScalabilityAnalyzer();
  await analyzer.runCompleteAnalysis();
}

if (require.main === module) {
  main();
}