#!/usr/bin/env node

/**
 * Script per testare la generazione di QR code reali
 * Genera QR code utilizzando le stesse librerie dell'app
 */

const QRCode = require('qrcode');

// Simula QRGenerator per generare dati QR
function generateODLQRData(data) {
  return {
    type: 'ODL',
    id: data.id,
    partNumber: data.partNumber,
    batch: data.batch,
    priority: data.priority,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
}

async function testQRGeneration() {
  console.log('🔳 Testing Real QR Code Generation...');
  
  try {
    // Test data che corrisponde a ODL-24-001
    const testData = {
      id: 'ODL-24-001',
      partNumber: '8G5350A01',
      priority: 'HIGH'
    };

    // Genera dati QR
    const qrData = generateODLQRData(testData);
    const qrString = JSON.stringify(qrData);
    
    console.log('📋 QR Data JSON:', qrString);
    
    // Genera QR code SVG
    const qrCodeSVG = await QRCode.toString(qrString, { type: 'svg' });
    
    console.log('✅ Generated QR Code SVG:');
    console.log(qrCodeSVG.substring(0, 200) + '...');
    
    // Salva esempio QR in file HTML
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Test QR Code - ${testData.id}</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
        .qr-container { border: 2px solid #333; padding: 20px; display: inline-block; }
        .qr-code svg { width: 200px; height: 200px; }
    </style>
</head>
<body>
    <div class="qr-container">
        <h2>${testData.id}</h2>
        <div class="qr-code">${qrCodeSVG}</div>
        <p>${testData.partNumber} - Priority: ${testData.priority}</p>
        <p>Timestamp: ${qrData.timestamp}</p>
    </div>
</body>
</html>
    `;
    
    require('fs').writeFileSync('/home/antonio/Scaricati/QR_REAL_' + testData.id + '.html', htmlContent);
    
    console.log('💾 Saved real QR code to: /home/antonio/Scaricati/QR_REAL_' + testData.id + '.html');
    
    // Test anche data matrix format
    const qrCodeDataURL = await QRCode.toDataURL(qrString);
    console.log('🔗 Data URL preview:', qrCodeDataURL.substring(0, 100) + '...');
    
    // Test scanning simulato
    console.log('\n📱 Simulated QR Scan Test:');
    console.log('Raw QR data that would be scanned:', qrString);
    
    try {
      const scannedData = JSON.parse(qrString);
      console.log('✅ Successfully parsed scanned data:');
      console.log('  Type:', scannedData.type);
      console.log('  ID:', scannedData.id);
      console.log('  Part Number:', scannedData.partNumber);
      console.log('  Priority:', scannedData.priority);
      console.log('  Timestamp:', scannedData.timestamp);
      
      // Valida formato
      if (scannedData.type === 'ODL' && scannedData.id && scannedData.partNumber) {
        console.log('✅ QR data format is valid for MES system');
      } else {
        console.log('❌ QR data format is invalid');
      }
      
    } catch (error) {
      console.log('❌ Failed to parse scanned QR data:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ QR generation failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 MES Aerospazio - Real QR Code Test\n');
  
  const success = await testQRGeneration();
  
  if (success) {
    console.log('\n🎉 QR Code generation test completed successfully!');
    console.log('📄 Check the generated HTML file to see the real QR code.');
  } else {
    console.log('\n❌ QR Code generation test failed.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}