/**
 * Test per le tabelle di estensione reparto-specifiche
 * Da eseguire nella console del browser dopo login
 */

(async function testExtensions() {
  console.log('%c=== TEST ESTENSIONI REPARTO ===', 'color: purple; font-size: 20px; font-weight: bold');
  
  const log = {
    success: (msg) => console.log(`%c✓ ${msg}`, 'color: green'),
    error: (msg) => console.log(`%c✗ ${msg}`, 'color: red'),
    info: (msg) => console.log(`%c➤ ${msg}`, 'color: blue')
  };

  // 1. TEST PART AUTOCLAVE
  console.group('%c🔥 TEST PART AUTOCLAVE', 'color: orange; font-size: 16px');
  
  // Cerca parti con configurazione autoclave
  log.info('Recupero parti con configurazione autoclave');
  const partsResp = await fetch('/api/parts?hasAutoclaveConfig=true');
  const partsData = await partsResp.json();
  
  if (partsData.parts?.length > 0) {
    log.success(`Trovate ${partsData.parts.length} parti con config autoclave`);
    
    // Mostra dettagli prima parte
    const part = partsData.parts[0];
    if (part.partAutoclave) {
      console.table({
        'Part Number': part.partNumber,
        'Ciclo Cura Default': part.defaultCuringCycleId ? '✓' : '✗',
        'Linee Vacuum Default': part.defaultVacuumLines || 'N/A',
        'Setup Time (min)': part.partAutoclave.setupTime,
        'Temperatura Max': part.partAutoclave.maxTemperature,
        'Pressione Max': part.partAutoclave.maxPressure
      });
    }
  }
  
  // Test creazione parte con config autoclave
  log.info('Creazione parte con configurazione autoclave');
  const newPartWithAutoclave = {
    partNumber: `AC-TEST-${Date.now()}`,
    description: 'Parte test con config autoclave',
    material: 'CFRP',
    category: 'STRUCTURAL',
    defaultCuringCycleId: 'clngw4dik0000iko0vnpdr0vy', // ID ciclo dal seed
    defaultVacuumLines: 3,
    partAutoclave: {
      setupTime: 45,
      maxTemperature: 180,
      maxPressure: 7,
      vacuumRequirement: 0.95,
      compatibleCycles: ['clngw4dik0000iko0vnpdr0vy', 'clngw4dik0001iko0lp83oi7m']
    }
  };
  
  const createResp = await fetch('/api/parts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPartWithAutoclave)
  });
  
  if (createResp.ok) {
    const created = await createResp.json();
    log.success(`Parte con config autoclave creata: ${created.part.partNumber}`);
    
    // Cleanup
    await fetch(`/api/parts/${created.part.id}`, { method: 'DELETE' });
  }
  
  console.groupEnd();

  // 2. TEST PART CLEANROOM
  console.group('%c🧹 TEST PART CLEANROOM', 'color: cyan; font-size: 16px');
  
  log.info('Recupero parti con configurazione cleanroom');
  const cleanroomResp = await fetch('/api/parts?hasCleanroomConfig=true');
  const cleanroomData = await cleanroomResp.json();
  
  if (cleanroomData.parts?.length > 0) {
    log.success(`Trovate ${cleanroomData.parts.length} parti con config cleanroom`);
    
    const part = cleanroomData.parts[0];
    if (part.partCleanroom) {
      console.table({
        'Part Number': part.partNumber,
        'Sequenza Layup': part.partCleanroom.layupSequence,
        'Tipo Resina': part.partCleanroom.resinType,
        'Tempo Ciclo (min)': part.partCleanroom.cycleTime,
        'Richiede Camera Pulita': part.partCleanroom.requiresCleanRoom ? '✓' : '✗'
      });
    }
  }
  
  console.groupEnd();

  // 3. TEST PART NDI
  console.group('%c🔍 TEST PART NDI', 'color: blue; font-size: 16px');
  
  log.info('Recupero parti con configurazione NDI');
  const ndiResp = await fetch('/api/parts?hasNDIConfig=true');
  const ndiData = await ndiResp.json();
  
  if (ndiData.parts?.length > 0) {
    log.success(`Trovate ${ndiData.parts.length} parti con config NDI`);
    
    const part = ndiData.parts[0];
    if (part.partNDI) {
      console.table({
        'Part Number': part.partNumber,
        'Metodo Ispezione': part.partNDI.inspectionMethod,
        'Criteri Accettazione': part.partNDI.acceptanceCriteria,
        'Tempo Ispezione (min)': part.partNDI.inspectionTime,
        'Richiede Calibrazione': part.partNDI.requiresCalibration ? '✓' : '✗'
      });
    }
  }
  
  console.groupEnd();

  // 4. TEST PART-TOOL RELATIONSHIPS
  console.group('%c🔧 TEST PART-TOOL', 'color: magenta; font-size: 16px');
  
  log.info('Recupero relazioni parte-utensile');
  const toolsResp = await fetch('/api/tools');
  const toolsData = await toolsResp.json();
  
  if (toolsData.tools?.length > 0) {
    log.success(`Trovati ${toolsData.tools.length} utensili`);
    
    // Mostra utensili con parti associate
    const toolsWithParts = toolsData.tools.filter(t => t.partTools?.length > 0);
    console.log(`Utensili con parti associate: ${toolsWithParts.length}`);
    
    if (toolsWithParts[0]) {
      const tool = toolsWithParts[0];
      console.table({
        'Codice Utensile': tool.code,
        'Nome': tool.name,
        'Parti Associate': tool.partTools.length,
        'Base (m²)': tool.base,
        'Altezza (m)': tool.height,
        'Peso (kg)': tool.weight
      });
    }
  }
  
  console.groupEnd();

  // 5. TEST TIME METRICS
  console.group('%c⏱️ TEST TIME METRICS', 'color: green; font-size: 16px');
  
  log.info('GET /api/reports/time-metrics');
  const metricsResp = await fetch('/api/reports/time-metrics');
  const metricsData = await metricsResp.json();
  
  if (metricsData.metrics?.length > 0) {
    log.success(`Trovate ${metricsData.metrics.length} metriche temporali`);
    
    // Raggruppa per reparto
    const byDepartment = metricsData.metrics.reduce((acc, m) => {
      const dept = m.department.name;
      if (!acc[dept]) acc[dept] = { count: 0, totalTime: 0 };
      acc[dept].count++;
      acc[dept].totalTime += m.actualDuration || 0;
      return acc;
    }, {});
    
    console.table(Object.entries(byDepartment).map(([dept, data]) => ({
      Reparto: dept,
      'N° Operazioni': data.count,
      'Tempo Totale (min)': Math.round(data.totalTime / 60),
      'Tempo Medio (min)': Math.round(data.totalTime / data.count / 60)
    })));
  }
  
  console.groupEnd();

  // 6. TEST QUALITY TRACKING
  console.group('%c✅ TEST QUALITY', 'color: gold; font-size: 16px');
  
  log.info('Recupero ispezioni qualità');
  const qualityResp = await fetch('/api/quality/inspections');
  const qualityData = await qualityResp.json();
  
  if (qualityData.inspections?.length > 0) {
    log.success(`Trovate ${qualityData.inspections.length} ispezioni`);
    
    // Statistiche risultati
    const results = qualityData.inspections.reduce((acc, i) => {
      acc[i.result] = (acc[i.result] || 0) + 1;
      return acc;
    }, {});
    
    console.table(results);
  }
  
  // Test non conformità
  log.info('Recupero non conformità');
  const ncResp = await fetch('/api/quality/non-conformities');
  const ncData = await ncResp.json();
  
  if (ncData.nonConformities?.length > 0) {
    log.success(`Trovate ${ncData.nonConformities.length} non conformità`);
    
    const ncByType = ncData.nonConformities.reduce((acc, nc) => {
      acc[nc.type] = (acc[nc.type] || 0) + 1;
      return acc;
    }, {});
    
    console.table(ncByType);
  }
  
  console.groupEnd();

  console.log('\n%c=== TEST ESTENSIONI COMPLETATO ===', 'color: purple; font-size: 18px; font-weight: bold');
})();