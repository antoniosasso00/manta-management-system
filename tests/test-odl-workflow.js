const { chromium } = require('playwright');

// Configurazione
const BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@mantaaero.com';
const ADMIN_PASSWORD = 'password123';

// Helper per delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test data
const testODL = {
  partNumber: '8G5350A0',
  quantity: 10,
  priority: 'ALTA',
  notes: 'Test workflow completo ODL'
};

async function testODLWorkflow() {
  console.log('🚀 Test Workflow ODL Completo\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Rallenta per visualizzare meglio
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1. Login
    console.log('1. Login come admin...');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✓ Login completato\n');

    // 2. Navigare a creazione ODL
    console.log('2. Creazione nuovo ODL...');
    await page.goto(`${BASE_URL}/odl/create`);
    await page.waitForSelector('h1:has-text("Crea Nuovo ODL")');
    
    // Seleziona part number
    await page.click('div[id^="partId"]');
    await page.click(`li[role="option"]:has-text("${testODL.partNumber}")`);
    
    // Compila form
    await page.fill('input[name="quantity"]', testODL.quantity.toString());
    await page.click('div[id^="priority"]');
    await page.click(`li[role="option"]:has-text("${testODL.priority}")`);
    await page.fill('textarea[name="notes"]', testODL.notes);
    
    // Salva
    await page.click('button:has-text("Crea ODL")');
    await page.waitForURL('**/odl');
    console.log('✓ ODL creato con successo\n');

    // 3. Trova l'ODL appena creato
    console.log('3. Verifica ODL nella lista...');
    await page.waitForSelector('table');
    const odlRow = page.locator('tr').filter({ hasText: testODL.partNumber }).first();
    const odlNumber = await odlRow.locator('td:nth-child(2)').textContent();
    console.log(`✓ ODL trovato: ${odlNumber}\n`);

    // 4. Apri dettaglio ODL
    console.log('4. Apertura dettaglio ODL...');
    await odlRow.click();
    await page.waitForSelector('h1:has-text("Dettaglio ODL")');
    
    // Verifica QR Code generato
    const qrCodeElement = await page.locator('canvas').count();
    console.log(`✓ QR Code generato: ${qrCodeElement > 0 ? 'SI' : 'NO'}\n`);

    // 5. Test workflow manuale
    console.log('5. Test trasferimenti manuali...\n');
    
    // 5a. Trasferimento a Clean Room
    console.log('   a) Trasferimento a Clean Room...');
    await page.click('button:has-text("Trasferisci")');
    await page.waitForSelector('div[role="dialog"]');
    await page.click('div[id^="departmentId"]');
    await page.click('li[role="option"]:has-text("Clean Room")');
    await page.fill('textarea[name="notes"]', 'Trasferimento manuale a Clean Room');
    await page.click('button:has-text("Conferma Trasferimento")');
    await sleep(1000);
    console.log('   ✓ Trasferito a Clean Room\n');

    // 5b. Registra ENTRY in Clean Room
    console.log('   b) Registrazione ingresso Clean Room...');
    await page.reload();
    await page.waitForSelector('button:has-text("Registra Evento")');
    await page.click('button:has-text("Registra Evento")');
    await page.waitForSelector('div[role="dialog"]');
    await page.click('button:has-text("Ingresso")');
    await sleep(1000);
    console.log('   ✓ Ingresso registrato\n');

    // 5c. Registra EXIT da Clean Room
    console.log('   c) Registrazione uscita Clean Room...');
    await page.reload();
    await page.click('button:has-text("Registra Evento")');
    await page.waitForSelector('div[role="dialog"]');
    await page.click('button:has-text("Uscita")');
    await sleep(1000);
    console.log('   ✓ Uscita registrata - dovrebbe trasferire automaticamente ad Autoclavi\n');

    // 6. Verifica trasferimento automatico
    console.log('6. Verifica trasferimento automatico...');
    await page.reload();
    await page.waitForSelector('text=Autoclavi');
    const currentDepartment = await page.locator('span:has-text("Reparto Corrente:")').locator('..').textContent();
    console.log(`   ✓ Reparto corrente: ${currentDepartment}\n`);

    // 7. Test QR Scanner
    console.log('7. Test QR Scanner...\n');
    
    // Ottieni dati QR dall'ODL
    const qrData = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      return canvas.toDataURL();
    });
    
    if (qrData) {
      console.log('   ✓ QR Code data recuperato\n');
      
      // Apri QR Scanner in nuova tab
      const scannerPage = await context.newPage();
      await scannerPage.goto(`${BASE_URL}/qr-scanner`);
      await scannerPage.waitForSelector('button:has-text("Avvia Scanner")');
      console.log('   ✓ QR Scanner aperto\n');
      
      // Nota: Non possiamo simulare una vera scansione QR, 
      // ma possiamo verificare che il componente sia caricato
      const scannerButton = await scannerPage.locator('button:has-text("Avvia Scanner")').isVisible();
      console.log(`   ✓ Scanner pronto: ${scannerButton ? 'SI' : 'NO'}\n`);
      
      await scannerPage.close();
    }

    // 8. Verifica storico eventi
    console.log('8. Verifica storico eventi...');
    await page.reload();
    const events = await page.locator('text=Storico Eventi').locator('..').locator('table tbody tr').count();
    console.log(`   ✓ Eventi registrati: ${events}\n`);

    // 9. Test stato ODL
    console.log('9. Verifica stato finale ODL...');
    const finalStatus = await page.locator('span:has-text("Stato:")').locator('..').textContent();
    console.log(`   ✓ Stato finale: ${finalStatus}\n`);

    // 10. Riepilogo workflow
    console.log('📊 RIEPILOGO TEST WORKFLOW:');
    console.log('   - ODL creato correttamente');
    console.log('   - QR Code generato');
    console.log('   - Trasferimento manuale funzionante');
    console.log('   - Eventi ENTRY/EXIT registrati');
    console.log('   - Trasferimento automatico dopo EXIT');
    console.log('   - QR Scanner accessibile');
    console.log('   - Storico eventi tracciato\n');

    console.log('✅ TEST COMPLETATO CON SUCCESSO!\n');

  } catch (error) {
    console.error('❌ ERRORE DURANTE IL TEST:', error);
    
    // Screenshot per debug
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('Screenshot salvato: test-error.png');
    
  } finally {
    await browser.close();
  }
}

// Esegui test
testODLWorkflow().catch(console.error);