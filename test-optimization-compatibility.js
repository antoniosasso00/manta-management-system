#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOptimizationCompatibility() {
  console.log('🔍 Test compatibilità microservizio ottimizzazione...\n');

  try {
    // 1. Verifica dati disponibili
    console.log('1. Verifica dati nel database...');
    
    const partsWithAutoclave = await prisma.part.findMany({
      include: {
        autoclaveConfig: {
          include: {
            curingCycle: true
          }
        },
        partTools: {
          include: {
            tool: true
          }
        },
        odls: {
          where: {
            status: {
              in: ['CLEANROOM_COMPLETED', 'IN_AUTOCLAVE']
            }
          }
        }
      }
    });

    const autoclaves = await prisma.autoclave.findMany({
      where: { isActive: true }
    });

    console.log(`   ✓ Parts con configurazione autoclave: ${partsWithAutoclave.filter(p => p.autoclaveConfig).length}`);
    console.log(`   ✓ Parts con tooling: ${partsWithAutoclave.filter(p => p.partTools.length > 0).length}`);
    console.log(`   ✓ ODL disponibili per ottimizzazione: ${partsWithAutoclave.reduce((sum, p) => sum + p.odls.length, 0)}`);
    console.log(`   ✓ Autoclavi attive: ${autoclaves.length}\n`);

    // 2. Test conversione dati
    if (partsWithAutoclave.length > 0) {
      console.log('2. Test conversione dati per microservizio...');
      
      const testPart = partsWithAutoclave.find(p => p.autoclaveConfig && p.partTools.length > 0 && p.odls.length > 0);
      
      if (testPart) {
        const testODL = testPart.odls[0];
        
        const optimizationData = {
          odls: [{
            id: testODL.id,
            odl_number: testODL.odlNumber,
            part_number: testPart.partNumber,
            curing_cycle: testPart.autoclaveConfig.curingCycle.code,
            vacuum_lines: testPart.autoclaveConfig.vacuumLines,
            tools: testPart.partTools.map(pt => ({
              id: pt.tool.id,
              width: pt.tool.base,
              height: pt.tool.height,
              weight: pt.tool.weight || 0,
            }))
          }],
          autoclaves: autoclaves.map(a => ({
            id: a.id,
            code: a.code,
            width: a.maxWidth,
            height: a.maxLength,
            vacuum_lines: a.vacuumLines,
            max_weight: null
          }))
        };

        console.log('   ✓ Dati convertiti per microservizio:');
        console.log(`     - ODL: ${optimizationData.odls[0].odl_number} (${optimizationData.odls[0].part_number})`);
        console.log(`     - Ciclo cura: ${optimizationData.odls[0].curing_cycle}`);
        console.log(`     - Linee vacuum: ${optimizationData.odls[0].vacuum_lines}`);
        console.log(`     - Tools: ${optimizationData.odls[0].tools.length}`);
        console.log(`     - Autoclavi: ${optimizationData.autoclaves.length}\n`);

        // 3. Test chiamata microservizio
        console.log('3. Test chiamata microservizio...');
        
        const response = await fetch('http://localhost:8000/api/v1/optimization/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(optimizationData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('   ✅ Microservizio risponde correttamente!');
          console.log(`     - Gruppi cicli: ${result.cycle_groups?.length || 0}`);
          console.log(`     - Raccomandazioni: ${result.recommendations?.length || 0}`);
          
          if (result.cycle_groups?.length > 0) {
            const group = result.cycle_groups[0];
            console.log(`     - Primo gruppo: ${group.cycle_code} (${group.odl_count} ODL, efficiency: ${group.optimization_score.toFixed(3)})`);
          }
        } else {
          const error = await response.text();
          console.log(`   ❌ Errore microservizio: ${response.status}`);
          console.log(`     ${error}`);
        }

      } else {
        console.log('   ⚠️  Nessun Part con configurazione completa trovato');
      }
    } else {
      console.log('   ⚠️  Nessun Part trovato nel database');
    }

    console.log('\n✅ Test completato!');

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testOptimizationCompatibility().catch(console.error);