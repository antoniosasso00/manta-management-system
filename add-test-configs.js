const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addConfigs() {
  try {
    const parts = await prisma.part.findMany({ take: 3 });
    const cycle = await prisma.curingCycle.findFirst();
    
    if (!cycle) {
      console.log('❌ Nessun ciclo di cura trovato');
      return;
    }
    
    for (const part of parts) {
      await prisma.partAutoclave.upsert({
        where: { partId: part.id },
        create: {
          partId: part.id,
          curingCycleId: cycle.id,
          vacuumLines: 2,
          setupTime: 30
        },
        update: {}
      });
    }
    
    await prisma.oDL.updateMany({
      where: { status: 'CREATED' },
      data: { status: 'CLEANROOM_COMPLETED' }
    });
    
    console.log('✅ Configurazioni aggiunte');
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addConfigs();