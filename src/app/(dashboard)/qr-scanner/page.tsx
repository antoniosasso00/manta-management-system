'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Fab
} from '@mui/material';
import {
  QrCodeScanner,
  PlayArrow,
  Stop,
  AccessTime,
  CheckCircle,
  CloudOff,
  Cloud,
  History,
  CameraAlt
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';

// QR Scanner con @zxing/browser
import { BrowserMultiFormatReader } from '@zxing/library';

interface QRData {
  type: string;
  id: string;
  odlNumber?: string;
  partNumber?: string;
  timestamp: string;
}

interface ScanEvent {
  id: string;
  odlId: string;
  odlNumber: string;
  eventType: 'ENTRY' | 'EXIT';
  timestamp: string;
  synced: boolean;
  duration?: number;
}

interface ActiveTimer {
  odlId: string;
  odlNumber: string;
  startTime: number;
  departmentId: string;
}

export default function QRScannerPage() {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<QRData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [recentScans, setRecentScans] = useState<ScanEvent[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor stato online/offline
  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Carica dati da localStorage all'avvio
  useEffect(() => {
    loadOfflineData();
    if (isOnline) {
      syncOfflineData();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer per ODL attivo
  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - activeTimer.startTime);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeTimer]);

  const loadOfflineData = () => {
    const savedScans = localStorage.getItem('qr-recent-scans');
    const savedTimer = localStorage.getItem('qr-active-timer');
    
    if (savedScans) {
      setRecentScans(JSON.parse(savedScans));
    }
    
    if (savedTimer) {
      const timer = JSON.parse(savedTimer);
      setActiveTimer(timer);
      setElapsedTime(Date.now() - timer.startTime);
    }
  };

  const saveToLocalStorage = (scans: ScanEvent[], timer: ActiveTimer | null) => {
    localStorage.setItem('qr-recent-scans', JSON.stringify(scans));
    if (timer) {
      localStorage.setItem('qr-active-timer', JSON.stringify(timer));
    } else {
      localStorage.removeItem('qr-active-timer');
    }
  };

  const syncOfflineData = async () => {
    const unsyncedScans = recentScans.filter(scan => !scan.synced);
    
    for (const scan of unsyncedScans) {
      try {
        await fetch('/api/production/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            odlId: scan.odlId,
            departmentId: user?.departmentId,
            eventType: scan.eventType,
            timestamp: scan.timestamp,
            userId: user?.id
          })
        });
        
        // Marca come sincronizzato
        scan.synced = true;
      } catch (error) {
        console.error('Sync error:', error);
      }
    }
    
    setRecentScans([...recentScans]);
    saveToLocalStorage(recentScans, activeTimer);
  };

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      const scanner = new BrowserMultiFormatReader();
      scannerRef.current = scanner;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        scanner.decodeFromVideoDevice(null, videoRef.current, (result) => {
          if (result) {
            handleScanResult(result.getText());
            stopScanning();
          }
        });
      }
    } catch (cameraError) {
      setError('Errore accesso camera: ' + (cameraError as Error).message);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.reset();
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleScanResult = (qrText: string) => {
    try {
      const qrData: QRData = JSON.parse(qrText);
      
      if (qrData.type !== 'ODL') {
        const error = new Error('QR Code non valido per ODL');
        throw error;
      }
      
      setScanResult(qrData);
      setError(null);
    } catch {
      setError('QR Code non valido');
    }
  };

  const handleEntryExit = async (eventType: 'ENTRY' | 'EXIT') => {
    if (!scanResult || !user) return;
    
    setLoading(true);
    
    try {
      const newScan: ScanEvent = {
        id: Date.now().toString(),
        odlId: scanResult.id,
        odlNumber: scanResult.odlNumber || '',
        eventType,
        timestamp: new Date().toISOString(),
        synced: false
      };

      // Timer logic
      if (eventType === 'ENTRY') {
        // Inizio timer
        const timer: ActiveTimer = {
          odlId: scanResult.id,
          odlNumber: scanResult.odlNumber || '',
          startTime: Date.now(),
          departmentId: user.departmentId || ''
        };
        setActiveTimer(timer);
      } else if (eventType === 'EXIT' && activeTimer) {
        // Fine timer
        const duration = Date.now() - activeTimer.startTime;
        newScan.duration = duration;
        setActiveTimer(null);
        setElapsedTime(0);
      }

      // Salva offline
      const updatedScans = [newScan, ...recentScans].slice(0, 10);
      setRecentScans(updatedScans);
      saveToLocalStorage(updatedScans, eventType === 'ENTRY' ? activeTimer : null);

      // Prova sync online
      if (isOnline) {
        try {
          const response = await fetch('/api/production/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              odlId: scanResult.id,
              departmentId: user.departmentId,
              eventType,
              userId: user.id,
              duration: newScan.duration
            })
          });

          if (response.ok) {
            newScan.synced = true;
            
            // Gestione speciale per reparto AUTOCLAVI
            if (eventType === 'EXIT' && user.departmentId === 'AUTOCLAVI') {
              await handleAutoclaveExit(scanResult.id);
            } else if (eventType === 'EXIT') {
              // Attiva trasferimento automatico per altri reparti
              await triggerAutoTransfer(scanResult.id);
            }
          }
        } catch (syncError) {
          console.error('Sync error:', syncError);
        }
      }

      setScanResult(null);
    } catch (eventError) {
      setError('Errore registrazione evento');
      console.error('Event registration error:', eventError);
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoTransfer = async (odlId: string) => {
    try {
      await fetch('/api/workflow/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ odlId })
      });
    } catch (error) {
      console.error('Auto transfer error:', error);
    }
  };

  const handleAutoclaveExit = async (odlId: string) => {
    try {
      // Cerca batch contenente l'ODL scansionato
      const response = await fetch(`/api/autoclavi/batches/by-odl/${odlId}`);
      
      if (!response.ok) {
        // Se non c'è batch, procedi con trasferimento normale
        await triggerAutoTransfer(odlId);
        return;
      }

      const data = await response.json();
      const batch = data.batch;

      if (batch && ['IN_CURE', 'COMPLETED'].includes(batch.status)) {
        // Mostra dialog per avanzamento batch
        const confirmed = confirm(
          `ODL appartiene al batch ${batch.loadNumber} (${batch.status}).\n` +
          `Vuoi avanzare l'intero batch al prossimo stato?\n` +
          `Questo influenzerà tutti i ${batch.odlCount} ODL del batch.`
        );

        if (confirmed) {
          await advanceBatchFromScan(batch.id, odlId);
        }
      } else {
        // Batch non in stato avanzabile, trasferimento normale
        await triggerAutoTransfer(odlId);
      }
    } catch (error) {
      console.error('Autoclave exit handling error:', error);
      // Fallback a trasferimento normale
      await triggerAutoTransfer(odlId);
    }
  };

  const advanceBatchFromScan = async (batchId: string, scannedOdlId: string) => {
    try {
      const response = await fetch('/api/autoclavi/batches/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          targetStatus: 'COMPLETED', // Default advancement
          scannedOdlId
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Mostra notifica di successo
        alert(`✅ ${result.message}\nODL aggiornati: ${result.odlUpdates?.join(', ')}`);
      } else {
        throw new Error(result.error || 'Errore avanzamento batch');
      }
    } catch (error) {
      console.error('Batch advancement error:', error);
      alert(`❌ Errore avanzamento batch: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <Box className="p-4 space-y-4">
      <Box className="flex items-center justify-between">
        <Typography variant="h4" className="flex items-center gap-2">
          <QrCodeScanner />
          Scanner QR ODL
        </Typography>
        
        <Chip 
          icon={isOnline ? <Cloud /> : <CloudOff />}
          label={isOnline ? 'Online' : 'Offline'}
          color={isOnline ? 'success' : 'warning'}
        />
      </Box>

      {/* Timer Attivo */}
      {activeTimer && (
        <Paper className="p-4 bg-blue-50">
          <Typography variant="h6" className="flex items-center gap-2 mb-2">
            <AccessTime color="primary" />
            Timer Attivo - ODL {activeTimer.odlNumber}
          </Typography>
          <Typography variant="h4" color="primary">
            {formatTime(elapsedTime)}
          </Typography>
          <LinearProgress 
            variant="indeterminate" 
            className="mt-2"
            color="primary"
          />
        </Paper>
      )}

      {/* Scanner Area */}
      <Paper className="p-4">
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Box className="md:col-span-2">
            <Box className="text-center">
              {!isScanning ? (
                <Box className="space-y-4">
                  <QrCodeScanner sx={{ fontSize: 100, color: 'grey.400' }} />
                  <Typography variant="h6">
                    Scansiona QR Code ODL
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CameraAlt />}
                    onClick={startScanning}
                    className="w-full max-w-xs"
                  >
                    Avvia Scanner
                  </Button>
                </Box>
              ) : (
                <Box className="space-y-4">
                  <video
                    ref={videoRef}
                    className="w-full max-w-sm mx-auto rounded"
                    autoPlay
                    muted
                    playsInline
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={stopScanning}
                  >
                    Interrompi Scanner
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          <Box>
            {/* Risultato Scan */}
            {scanResult && (
              <Card className="mb-4">
                <CardContent>
                  <Typography variant="h6" className="flex items-center gap-2 mb-3">
                    <CheckCircle color="success" />
                    ODL Trovato
                  </Typography>
                  
                  <Typography><strong>ID:</strong> {scanResult.id}</Typography>
                  <Typography><strong>Numero:</strong> {scanResult.odlNumber}</Typography>
                  
                  <Box className="mt-3 space-y-2">
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={<PlayArrow />}
                      onClick={() => handleEntryExit('ENTRY')}
                      disabled={loading || !!activeTimer}
                    >
                      Registra Ingresso
                    </Button>
                    
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      startIcon={<Stop />}
                      onClick={() => handleEntryExit('EXIT')}
                      disabled={loading || !activeTimer}
                    >
                      Registra Uscita
                    </Button>
                  </Box>
                  
                  {loading && (
                    <Box className="mt-2 text-center">
                      <CircularProgress size={24} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Errori */}
            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Storico Recenti */}
      <Paper className="p-4">
        <Typography variant="h6" className="flex items-center gap-2 mb-3">
          <History />
          Scansioni Recenti
        </Typography>
        
        <List>
          {recentScans.slice(0, 5).map((scan) => (
            <ListItem key={scan.id}>
              <ListItemIcon>
                {scan.synced ? (
                  <CheckCircle color="success" />
                ) : (
                  <CloudOff color="warning" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={`ODL ${scan.odlNumber} - ${scan.eventType}`}
                secondary={
                  <Box>
                    <Typography variant="caption">
                      {new Date(scan.timestamp).toLocaleString()}
                    </Typography>
                    {scan.duration && (
                      <Typography variant="caption" className="ml-2">
                        Durata: {formatTime(scan.duration)}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
          
          {recentScans.length === 0 && (
            <ListItem>
              <ListItemText 
                primary="Nessuna scansione recente"
                className="text-center text-gray-500"
              />
            </ListItem>
          )}
        </List>
      </Paper>

      {/* Sync Manual Button */}
      {!isOnline && recentScans.some(s => !s.synced) && (
        <Fab
          color="primary"
          className="fixed bottom-4 right-4"
          onClick={syncOfflineData}
        >
          <Cloud />
        </Fab>
      )}
    </Box>
  );
}