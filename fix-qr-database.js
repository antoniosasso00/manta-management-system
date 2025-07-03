#!/usr/bin/env node

/**
 * Script per aggiornare il database con QR code reali per i primi 3 ODL
 */

const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');

const prisma = new PrismaClient();

// Helper function to generate real QR codes for ODLs
async function generateRealQRCode(odlNumber, partNumber, priority) {
  try {
    const qrData = {
      type: 'ODL',
      id: odlNumber,
      partNumber: partNumber,
      priority: priority,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    const qrCodeSVG = await QRCode.toString(JSON.stringify(qrData), { type: 'svg' });
    return qrCodeSVG;
  } catch (error) {
    console.error(`Error generating QR for ${odlNumber}:`, error);
    return `QR-${odlNumber}`;
  }
}

async function updateODLsWithRealQR() {
  console.log('🔳 Updating first 3 ODLs with real QR codes...');
  
  try {
    // Get first 3 ODLs with their part information
    const odls = await prisma.oDL.findMany({
      take: 3,
      include: {
        part: true
      }
    });
    
    console.log(`Found ${odls.length} ODLs to update`);
    
    for (const odl of odls) {
      console.log(`Updating ODL ${odl.odlNumber}...`);
      
      const realQRCode = await generateRealQRCode(
        odl.odlNumber, 
        odl.part.partNumber, 
        odl.priority
      );
      
      await prisma.oDL.update({
        where: { id: odl.id },
        data: { qrCode: realQRCode }
      });
      
      console.log(`✅ Updated ODL ${odl.odlNumber} with real QR code`);
    }
    
    console.log('🎉 Successfully updated ODLs with real QR codes!');
    
    // Verify the update
    const updatedOdls = await prisma.oDL.findMany({
      take: 3,
      select: {
        odlNumber: true,
        qrCode: true
      }
    });
    
    console.log('\n📊 Verification:');
    for (const odl of updatedOdls) {
      const isRealQR = odl.qrCode && odl.qrCode.includes('<svg');
      console.log(`${odl.odlNumber}: ${isRealQR ? '✅ Real QR' : '❌ Text QR'} (length: ${odl.qrCode?.length || 0})`);
    }
    
  } catch (error) {
    console.error('❌ Error updating ODLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 MES Aerospazio - Database QR Fix\n');
  await updateODLsWithRealQR();
}

if (require.main === module) {
  main();
}