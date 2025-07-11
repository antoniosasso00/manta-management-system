'use client';

import React, { useState, useEffect, useRef, Fragment } from 'react';
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
  Fab,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse,
  Divider,
  Snackbar,
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
  CameraAlt,
  Close,
  ExpandMore,
  ExpandLess,
  Sync,
  Pause,
  PlayCircle,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { TabContext, TabList } from '@mui/lab'
import { RetryManager, ConnectivityChecker, fetchWithRetry } from '@/utils/network-helpers';
import { EventType } from '@prisma/client';

// QR Scanner con @zxing/browser
import { BrowserMultiFormatReader } from '@zxing/browser';

interface QRData {
  type: string;
  id: string;
  odlNumber?: string;
  partNumber?: string;
  timestamp: string;
}

interface ODLDetails {
  id: string;
  odlNumber: string;
  partNumber: string;
  description: string;
  status: string;
  priority: string;
  quantity: number;
  currentDepartment?: string;
  lastEvent?: any;
}

interface ScanEvent {
  id: string;
  odlId: string;
  odlNumber: string;
  partNumber?: string;
  eventType: EventType;
  timestamp: string;
  synced: boolean;
  duration?: number;
  departmentName?: string;
  status?: 'success' | 'failed' | 'warning';
  errorMessage?: string;
}

interface ActiveTimer {
  odlId: string;
  odlNumber: string;
  startTime: number;
  departmentId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function QRScannerPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<QRData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isEffectivelyOnline, setIsEffectivelyOnline] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanEvent[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [autoclaveDialog, setAutoclaveDialog] = useState<{
    open: boolean;
    batch: any;
    odlId: string;
  }>({ open: false, batch: null, odlId: '' });
  const [odlDetails, setODLDetails] = useState<ODLDetails | null>(null);
  const [pendingAction, setPendingAction] = useState<{ odlId: string; action: EventType } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const connectivityCleanupRef = useRef<(() => void) | null>(null);

  // Monitor stato online/offline con test connettività effettiva
  useEffect(() => {
    // Cleanup previous connectivity monitoring
    if (connectivityCleanupRef.current) {
      connectivityCleanupRef.current();
    }

    // Start enhanced connectivity monitoring
    const cleanup = ConnectivityChecker.startMonitoring((effectivelyOnline) => {
      setIsEffectivelyOnline(effectivelyOnline);
      // Mantieni anche il check basic per fallback
      setIsOnline(navigator.onLine);
    }, 30000); // Check ogni 30 secondi

    connectivityCleanupRef.current = cleanup;

    // Event listeners per cambiamenti browser
    const handleOnlineStatus = async () => {
      const basicOnline = navigator.onLine;
      setIsOnline(basicOnline);
      
      if (basicOnline) {
        // Test effettivo quando browser dice online
        const effectivelyOnline = await ConnectivityChecker.isEffectivelyOnline();
        setIsEffectivelyOnline(effectivelyOnline);
      } else {
        setIsEffectivelyOnline(false);
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Test iniziale
    handleOnlineStatus();
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      if (connectivityCleanupRef.current) {
        connectivityCleanupRef.current();
      }
    };
  }, []);

  // Carica dati da localStorage all'avvio e sync quando torna online
  useEffect(() => {
    loadOfflineData();
    if (isEffectivelyOnline) {
      syncOfflineDataWithRetry();
    }
  }, [isEffectivelyOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer per ODL attivo
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (activeTimer) {
      intervalId = setInterval(() => {
        setElapsedTime(Date.now() - activeTimer.startTime);
      }, 1000);
      timerRef.current = intervalId;
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
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

  const syncOfflineDataWithRetry = async () => {
    try {
      await RetryManager.withRetry(async () => {
        const unsyncedScans = recentScans.filter(scan => !scan.synced);
        
        if (unsyncedScans.length === 0) {
          return; // Nulla da sincronizzare
        }

        // Sync in batch per migliorare performance
        const syncPromises = unsyncedScans.map(async (scan) => {
          const response = await fetchWithRetry('/api/workflow/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              odlId: scan.odlId,
              departmentId: user?.departmentId,
              actionType: scan.eventType,
              confirmationRequired: false,
              metadata: {
                source: 'qr-scanner-offline-sync',
                originalTimestamp: scan.timestamp
              }
            })
          }, {
            maxRetries: 2, // Retry meno aggressivo per singoli eventi
            baseDelay: 500
          });

          if (response.ok) {
            scan.synced = true;
            return { scan, success: true };
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        });

        // Aspetta completamento di tutti i sync
        const results = await Promise.allSettled(syncPromises);
        
        // Log risultati per debugging
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        if (successful > 0) {
          console.log(`[QR Sync] Sincronizzati ${successful} eventi con successo`);
        }
        
        if (failed > 0) {
          console.warn(`[QR Sync] Falliti ${failed} eventi durante la sincronizzazione`);
          // Non lanciare errore se alcuni eventi sono riusciti
        }

        // Aggiorna state anche se alcuni eventi hanno fallito
        setRecentScans([...recentScans]);
        saveToLocalStorage(recentScans, activeTimer);
      }, {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000
      });
    } catch (error) {
      console.error('[QR Sync] Sync completo fallito dopo tutti i retry:', error);
    }
  };

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      const scanner = new BrowserMultiFormatReader();
      scannerRef.current = scanner;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Ottieni l'ID del dispositivo video dalla stream
        const videoTrack = stream.getVideoTracks()[0];
        const deviceId = videoTrack.getSettings().deviceId || undefined;
        
        scanner.decodeFromVideoDevice(deviceId, videoRef.current, (result, error) => {
          if (result) {
            handleScanResult(result.getText());
            stopScanning();
          }
          if (error && !(error instanceof Error && error.message.includes('No barcode'))) {
            console.error('Errore scansione:', error);
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
      (scannerRef.current as any).reset?.();
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleScanResult = async (qrText: string) => {
    try {
      const qrData: QRData = JSON.parse(qrText);
      
      if (qrData.type !== 'ODL') {
        throw new Error('QR Code non valido per ODL');
      }
      
      // Vibrazione e feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
      
      setScanResult(qrData);
      setError(null);
      
      // Carica dettagli ODL per determinare azioni disponibili
      await loadODLDetails(qrData.id);
    } catch {
      setError('QR Code non valido');
    }
  };

  const loadODLDetails = async (odlId: string) => {
    try {
      const response = await fetchWithRetry(`/api/odl/${odlId}`, {}, {
        maxRetries: 2,
        baseDelay: 1000
      });
      
      if (response.ok) {
        const data = await response.json();
        setODLDetails(data.odl);
      } else {
        setError('Impossibile caricare dettagli ODL');
      }
    } catch (error) {
      setError('Errore durante il caricamento ODL');
      console.error('ODL details error:', error);
    }
  };

  const getAvailableActions = (odlDetails: ODLDetails): EventType[] => {
    // Stati completati - nessuna azione disponibile
    const completedStates = [
      'CLEANROOM_COMPLETED', 'AUTOCLAVE_COMPLETED', 'CONTROLLO_NUMERICO_COMPLETED',
      'NDI_COMPLETED', 'MONTAGGIO_COMPLETED', 'VERNICIATURA_COMPLETED',
      'CONTROLLO_QUALITA_COMPLETED', 'COMPLETED'
    ];
    
    if (completedStates.includes(odlDetails.status)) {
      return [];
    }
    
    // Determina azioni basate sull'ultimo evento
    const lastEventType = odlDetails.lastEvent?.eventType;
    
    switch (lastEventType) {
      case 'ASSIGNED':
        return ['ENTRY'];
      case 'ENTRY':
        return ['EXIT', 'PAUSE'];
      case 'EXIT':
        return [];
      case 'PAUSE':
        return ['RESUME'];
      case 'RESUME':
        return ['EXIT', 'PAUSE'];
      default:
        return ['ENTRY'];
    }
  };

  const handleAction = (action: EventType) => {
    if (!scanResult || !odlDetails) return;
    
    setPendingAction({ odlId: scanResult.id, action });
  };

  const confirmAction = async () => {
    if (!pendingAction || !scanResult || !user) return;
    
    setLoading(true);
    
    try {
      const newScan: ScanEvent = {
        id: Date.now().toString(),
        odlId: scanResult.id,
        odlNumber: scanResult.odlNumber || '',
        eventType: pendingAction.action,
        timestamp: new Date().toISOString(),
        synced: false
      };

      // Gestione timer solo per ENTRY/EXIT (non per PAUSE/RESUME)
      if (pendingAction.action === 'ENTRY') {
        const timer: ActiveTimer = {
          odlId: scanResult.id,
          odlNumber: scanResult.odlNumber || '',
          startTime: Date.now(),
          departmentId: user.departmentId || ''
        };
        setActiveTimer(timer);
      } else if (pendingAction.action === 'EXIT' && activeTimer) {
        const duration = Date.now() - activeTimer.startTime;
        newScan.duration = duration;
        setActiveTimer(null);
        setElapsedTime(0);
      }

      // Salva offline
      const updatedScans = [newScan, ...recentScans].slice(0, 20);
      setRecentScans(updatedScans);
      saveToLocalStorage(updatedScans, pendingAction.action === 'ENTRY' ? activeTimer : null);

      // Prova sync online
      if (isEffectivelyOnline) {
        try {
          const response = await fetchWithRetry('/api/workflow/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              odlId: scanResult.id,
              departmentId: user.departmentId,
              actionType: pendingAction.action,
              confirmationRequired: true,
              metadata: {
                source: 'qr-scanner',
                duration: newScan.duration
              }
            })
          }, {
            maxRetries: 2,
            baseDelay: 1000
          });

          const result = await response.json();

          if (response.ok) {
            newScan.synced = true;
            
            // Gestisci feedback trasferimento automatico
            if (pendingAction.action === 'EXIT' && result.autoTransfer) {
              const transfer = result.autoTransfer;
              if (transfer.success) {
                setSnackbar({
                  open: true,
                  message: transfer.message || `ODL trasferito automaticamente a ${transfer.nextDepartment?.name}`,
                  severity: 'success'
                });
              } else {
                setSnackbar({
                  open: true,
                  message: transfer.message || 'Trasferimento automatico non riuscito. Procedere manualmente.',
                  severity: 'warning'
                });
              }
            } else if (pendingAction.action === 'PAUSE') {
              setSnackbar({
                open: true,
                message: 'ODL messo in pausa. Rimane nel reparto in attesa di ripresa.',
                severity: 'info'
              });
            } else if (pendingAction.action === 'RESUME') {
              setSnackbar({
                open: true,
                message: 'ODL ripreso dalla pausa. Lavorazione ripristinata.',
                severity: 'success'
              });
            } else {
              setSnackbar({
                open: true,
                message: `Azione ${pendingAction.action} completata con successo`,
                severity: 'success'
              });
            }
            
            // Gestione speciale per reparto AUTOCLAVI
            if (pendingAction.action === 'EXIT' && user.departmentId === 'AUTOCLAVI' && result.autoTransfer?.targetDepartmentType === 'AUTOCLAVE') {
              await handleAutoclaveExit(scanResult.id);
            }
          } else {
            throw new Error(result.message || 'Errore durante la registrazione');
          }
        } catch (syncError) {
          console.error('[QR Scanner] Sync immediato fallito:', syncError);
          setSnackbar({
            open: true,
            message: 'Errore durante la sincronizzazione. Riprovare.',
            severity: 'error'
          });
        }
      }

      // Reset stato
      setScanResult(null);
      setODLDetails(null);
      setPendingAction(null);
    } catch (eventError) {
      setError('Errore registrazione evento');
      console.error('Event registration error:', eventError);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: EventType) => {
    switch (action) {
      case 'ENTRY': return <PlayArrow fontSize="small" />;
      case 'EXIT': return <Stop fontSize="small" />;
      case 'PAUSE': return <Pause fontSize="small" />;
      case 'RESUME': return <PlayCircle fontSize="small" />;
      default: return null;
    }
  };

  const getActionLabel = (action: EventType) => {
    switch (action) {
      case 'ENTRY': return 'Registra Ingresso';
      case 'EXIT': return 'Registra Uscita';
      case 'PAUSE': return 'Metti in Pausa';
      case 'RESUME': return 'Riprendi';
      default: return action;
    }
  };

  const getActionColor = (action: EventType) => {
    switch (action) {
      case 'ENTRY': return 'success';
      case 'EXIT': return 'error';
      case 'PAUSE': return 'warning';
      case 'RESUME': return 'primary';
      default: return 'primary';
    }
  };

  // Funzione triggerAutoTransfer non più necessaria - gestita automaticamente dalla nuova API

  const handleAutoclaveExit = async (odlId: string) => {
    try {
      const response = await fetchWithRetry(`/api/autoclavi/batches/by-odl/${odlId}`, {}, {
        maxRetries: 2,
        baseDelay: 1000
      });

      const data = await response.json();
      const batch = data.batch;

      if (batch && ['IN_CURE', 'COMPLETED'].includes(batch.status)) {
        setAutoclaveDialog({ open: true, batch, odlId });
      }
      // Il trasferimento automatico \u00e8 gestito dalla API workflow
    } catch (error) {
      console.error('[QR Scanner] Autoclave exit handling error:', error);
      // Il trasferimento automatico \u00e8 gestito dalla API workflow
    }
  };

  const advanceBatchFromScan = async () => {
    const { batch, odlId } = autoclaveDialog;
    
    try {
      const response = await fetchWithRetry('/api/autoclavi/batches/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          targetStatus: 'COMPLETED',
          scannedOdlId: odlId
        })
      }, {
        maxRetries: 2,
        baseDelay: 1000
      });

      const result = await response.json();

      if (response.ok) {
        setError(null);
        // Show success message
        setTimeout(() => {
          alert(`✅ ${result.message}\nODL aggiornati: ${result.odlUpdates?.join(', ')}`);
        }, 100);
      } else {
        throw new Error(result.error || 'Errore avanzamento batch');
      }
    } catch (error) {
      setError(`Errore avanzamento batch: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setAutoclaveDialog({ open: false, batch: null, odlId: '' });
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // Mobile optimized layout
  if (isMobile) {
    return (
      <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        {/* Status Bar */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              icon={isEffectivelyOnline ? <Cloud /> : <CloudOff />}
              label={isEffectivelyOnline ? 'Online' : 'Offline'}
              color={isEffectivelyOnline ? 'success' : 'warning'}
              size="small"
            />
            {isOnline && !isEffectivelyOnline && (
              <Chip 
                label="API Non Disponibili"
                color="error"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          
          {!isEffectivelyOnline && recentScans.some(s => !s.synced) && (
            <IconButton
              color="primary"
              onClick={syncOfflineDataWithRetry}
              sx={{ width: 44, height: 44 }}
              disabled={loading}
            >
              <Sync />
            </IconButton>
          )}
        </Box>

        {/* Timer Attivo */}
        {activeTimer && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccessTime fontSize="small" />
                  Timer Attivo - ODL {activeTimer.odlNumber}
                </Typography>
                <Typography variant="h4">
                  {formatTime(elapsedTime)}
                </Typography>
                <LinearProgress 
                  variant="indeterminate" 
                  sx={{ mt: 1, bgcolor: 'primary.dark' }}
                />
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Main Content Area */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Scanner/Result View */}
          {!showHistory ? (
            <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
              {!isScanning && !scanResult && (
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 3
                }}>
                  <QrCodeScanner sx={{ fontSize: 120, color: 'grey.400' }} />
                  <Typography variant="h6" align="center">
                    Scansiona QR Code ODL
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CameraAlt />}
                    onClick={startScanning}
                    sx={{ 
                      minHeight: 56,
                      minWidth: 200,
                      fontSize: '1.1rem'
                    }}
                  >
                    Avvia Scanner
                  </Button>
                </Box>
              )}

              {isScanning && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ 
                    position: 'relative', 
                    flex: 1, 
                    bgcolor: 'black',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <video
                      ref={videoRef}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      autoPlay
                      muted
                      playsInline
                    />
                    
                    {/* Scanner Overlay */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}>
                      {/* Dark overlay */}
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)'
                      }} />
                      
                      {/* Scan area */}
                      <Box sx={{
                        position: 'relative',
                        width: isMobile ? '80%' : '60%',
                        maxWidth: 300,
                        aspectRatio: '1',
                        borderRadius: 2
                      }}>
                        {/* Clear center area */}
                        <Box sx={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'transparent',
                          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                          borderRadius: 2
                        }} />
                        
                        {/* Animated corners */}
                        <Box sx={{
                          position: 'absolute',
                          inset: 0,
                          '&::before, &::after': {
                            content: '""',
                            position: 'absolute',
                            width: 40,
                            height: 40,
                            border: '3px solid',
                            borderColor: theme => theme.palette.primary.main
                          },
                          '&::before': {
                            top: 0,
                            left: 0,
                            borderRight: 'none',
                            borderBottom: 'none',
                            borderTopLeftRadius: 8
                          },
                          '&::after': {
                            top: 0,
                            right: 0,
                            borderLeft: 'none',
                            borderBottom: 'none',
                            borderTopRightRadius: 8
                          }
                        }} />
                        
                        <Box sx={{
                          position: 'absolute',
                          inset: 0,
                          '&::before, &::after': {
                            content: '""',
                            position: 'absolute',
                            width: 40,
                            height: 40,
                            border: '3px solid',
                            borderColor: theme => theme.palette.primary.main
                          },
                          '&::before': {
                            bottom: 0,
                            left: 0,
                            borderRight: 'none',
                            borderTop: 'none',
                            borderBottomLeftRadius: 8
                          },
                          '&::after': {
                            bottom: 0,
                            right: 0,
                            borderLeft: 'none',
                            borderTop: 'none',
                            borderBottomRightRadius: 8
                          }
                        }} />
                        
                        {/* Scanning line animation */}
                        <Box sx={{
                          position: 'absolute',
                          left: '10%',
                          right: '10%',
                          height: 2,
                          backgroundColor: theme => theme.palette.primary.main,
                          boxShadow: theme => `0 0 10px ${theme.palette.primary.main}`,
                          animation: 'scan 2s ease-in-out infinite',
                          '@keyframes scan': {
                            '0%': { top: '10%' },
                            '50%': { top: '90%' },
                            '100%': { top: '10%' }
                          }
                        }} />
                      </Box>
                      
                      {/* Instructions */}
                      <Typography
                        variant="body2"
                        sx={{
                          position: 'absolute',
                          bottom: '10%',
                          color: 'white',
                          textAlign: 'center',
                          px: 2,
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}
                      >
                        Inquadra il QR code nell&apos;area di scansione
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    onClick={stopScanning}
                    sx={{ minHeight: 56 }}
                  >
                    Interrompi Scanner
                  </Button>
                </Box>
              )}

              {scanResult && !odlDetails && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                  <CircularProgress size={48} />
                  <Typography variant="body1">Caricamento dettagli ODL...</Typography>
                </Box>
              )}

              {scanResult && odlDetails && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <CheckCircle color="success" />
                        ODL Trovato
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Numero ODL</Typography>
                        <Typography variant="body1" fontWeight={600}>{odlDetails.odlNumber}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Part Number</Typography>
                        <Typography variant="body1">{odlDetails.partNumber}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Stato Attuale</Typography>
                        <Chip 
                          label={odlDetails.status.replace('_', ' ')}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      
                      {odlDetails.lastEvent && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">Ultimo Evento</Typography>
                          <Typography variant="caption" display="block">
                            {odlDetails.lastEvent.eventType} - {new Date(odlDetails.lastEvent.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {getAvailableActions(odlDetails).length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Chip 
                          label="ODL Completato" 
                          color="success"
                          sx={{ fontWeight: 600, fontSize: '1rem', height: 40 }}
                        />
                      </Box>
                    ) : (
                      getAvailableActions(odlDetails).map((action) => (
                        <Button
                          key={action}
                          variant="contained"
                          color={getActionColor(action) as any}
                          size="large"
                          fullWidth
                          startIcon={getActionIcon(action)}
                          onClick={() => handleAction(action)}
                          disabled={loading}
                          sx={{ minHeight: 56 }}
                        >
                          {getActionLabel(action)}
                        </Button>
                      ))
                    )}

                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      onClick={() => {
                        setScanResult(null);
                        setODLDetails(null);
                      }}
                      sx={{ minHeight: 48 }}
                    >
                      Annulla
                    </Button>
                  </Box>
                  
                  {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          ) : (
            // History View
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <List sx={{ py: 0 }}>
                {recentScans.map((scan, index) => (
                  <Fragment key={scan.id}>
                    {index > 0 && <Divider />}
                    <ListItem sx={{ py: 2 }}>
                      <ListItemIcon>
                        {scan.status === 'failed' ? (
                          <Close color="error" />
                        ) : scan.synced ? (
                          <CheckCircle color="success" />
                        ) : (
                          <CloudOff color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1">
                              ODL {scan.odlNumber}
                            </Typography>
                            {scan.partNumber && (
                              <Typography variant="caption" color="text.secondary">
                                ({scan.partNumber})
                              </Typography>
                            )}
                            <Chip 
                              label={scan.eventType === 'ENTRY' ? 'Ingresso' : 'Uscita'}
                              size="small"
                              color={scan.eventType === 'ENTRY' ? 'success' : 'error'}
                            />
                            {scan.status === 'failed' && (
                              <Chip 
                                label="Errore"
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {new Date(scan.timestamp).toLocaleString()}
                            </Typography>
                            {scan.departmentName && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Reparto: {scan.departmentName}
                              </Typography>
                            )}
                            {scan.duration && (
                              <Typography variant="caption" display="block">
                                Durata: {formatTime(scan.duration)}
                              </Typography>
                            )}
                            {scan.errorMessage && (
                              <Typography variant="caption" display="block" color="error">
                                {scan.errorMessage}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </Fragment>
                ))}
                
                {recentScans.length === 0 && (
                  <ListItem>
                    <ListItemText 
                      primary="Nessuna scansione recente"
                      sx={{ textAlign: 'center', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </Box>

        {/* Bottom Navigation */}
        <TabContext value={tabValue}>
          <Paper sx={{ position: 'sticky', bottom: 0 }} elevation={3}>
            <TabList
              onChange={(_, newValue: number) => setTabValue(newValue)}
              variant="fullWidth"
              indicatorColor="primary"
            >
              <Tab 
                label="Scanner" 
                value={0} 
                icon={<QrCodeScanner />} 
                sx={{ minHeight: 64 }} 
                onClick={() => setShowHistory(false)}
              />
              <Tab 
                label={`Storico (${recentScans.length})`} 
                value={1} 
                icon={<History />} 
                sx={{ minHeight: 64 }} 
                onClick={() => setShowHistory(true)}
              />
            </TabList>
          </Paper>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
              {!isScanning && !scanResult && (
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: 3
                }}>
                  <QrCodeScanner sx={{ fontSize: 120, color: 'grey.400' }} />
                  <Typography variant="h6" align="center">
                    Scansiona QR Code ODL
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CameraAlt />}
                    onClick={startScanning}
                    sx={{ 
                      minHeight: 56,
                      minWidth: 200,
                      fontSize: '1.1rem'
                    }}
                  >
                    Avvia Scanner
                  </Button>
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <List sx={{ py: 0 }}>
                {recentScans.map((scan, index) => (
                  <Fragment key={scan.id}>
                    {index > 0 && <Divider />}
                    <ListItem sx={{ py: 2 }}>
                      <ListItemIcon>
                        {scan.status === 'failed' ? (
                          <Close color="error" />
                        ) : scan.synced ? (
                          <CheckCircle color="success" />
                        ) : (
                          <CloudOff color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body1">
                              ODL {scan.odlNumber}
                            </Typography>
                            {scan.partNumber && (
                              <Typography variant="caption" color="text.secondary">
                                ({scan.partNumber})
                              </Typography>
                            )}
                            <Chip 
                              label={scan.eventType === 'ENTRY' ? 'Ingresso' : 'Uscita'}
                              size="small"
                              color={scan.eventType === 'ENTRY' ? 'success' : 'error'}
                            />
                            {scan.status === 'failed' && (
                              <Chip 
                                label="Errore"
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {new Date(scan.timestamp).toLocaleString()}
                            </Typography>
                            {scan.departmentName && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Reparto: {scan.departmentName}
                              </Typography>
                            )}
                            {scan.duration && (
                              <Typography variant="caption" display="block">
                                Durata: {formatTime(scan.duration)}
                              </Typography>
                            )}
                            {scan.errorMessage && (
                              <Typography variant="caption" display="block" color="error">
                                {scan.errorMessage}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </Fragment>
                ))}
                {recentScans.length === 0 && (
                  <ListItem>
                    <ListItemText 
                      primary="Nessuna scansione recente"
                      sx={{ textAlign: 'center', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </TabPanel>
        </TabContext>


        {/* Autoclave Batch Dialog */}
        <Dialog
          open={autoclaveDialog.open}
          onClose={() => setAutoclaveDialog({ open: false, batch: null, odlId: '' })}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Avanzamento Batch Autoclave</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              L'ODL appartiene al batch <strong>{autoclaveDialog.batch?.loadNumber}</strong> 
              {' '}(stato: <strong>{autoclaveDialog.batch?.status}</strong>).
            </Typography>
            <Typography variant="body1">
              Vuoi avanzare l&apos;intero batch al prossimo stato?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Questo influenzerà tutti i {autoclaveDialog.batch?.odlCount} ODL del batch.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setAutoclaveDialog({ open: false, batch: null, odlId: '' })}
              sx={{ minHeight: 44 }}
            >
              Annulla
            </Button>
            <Button 
              onClick={advanceBatchFromScan} 
              variant="contained"
              sx={{ minHeight: 44 }}
            >
              Avanza Batch
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Desktop layout with enhanced connectivity monitoring
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Chip 
          icon={isEffectivelyOnline ? <Cloud /> : <CloudOff />}
          label={isEffectivelyOnline ? 'Online' : 'Offline'}
          color={isEffectivelyOnline ? 'success' : 'warning'}
        />
        {isOnline && !isEffectivelyOnline && (
          <Chip 
            label="API Non Disponibili"
            color="error"
            variant="outlined"
          />
        )}
      </Box>

      {/* Timer Attivo */}
      {activeTimer && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <AccessTime />
            Timer Attivo - ODL {activeTimer.odlNumber}
          </Typography>
          <Typography variant="h4">
            {formatTime(elapsedTime)}
          </Typography>
          <LinearProgress 
            variant="indeterminate" 
            sx={{ mt: 2, bgcolor: 'primary.dark' }}
          />
        </Paper>
      )}

      {/* Scanner Area */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { md: '2fr 1fr' }, gap: 4 }}>
          <Box>
            <Box sx={{ textAlign: 'center' }}>
              {!isScanning ? (
                <Box sx={{ py: 4 }}>
                  <QrCodeScanner sx={{ fontSize: 100, color: 'grey.400', mb: 3 }} />
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Scansiona QR Code ODL
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CameraAlt />}
                    onClick={startScanning}
                    sx={{ minWidth: 200, minHeight: 48 }}
                  >
                    Avvia Scanner
                  </Button>
                </Box>
              ) : (
                <Box>
                  <video
                    ref={videoRef}
                    style={{
                      width: '100%',
                      maxWidth: 500,
                      borderRadius: 8
                    }}
                    autoPlay
                    muted
                    playsInline
                  />
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={stopScanning}
                      sx={{ minHeight: 44 }}
                    >
                      Interrompi Scanner
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          <Box>
            {/* Risultato Scan */}
            {scanResult && odlDetails && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <CheckCircle color="success" />
                    ODL Trovato
                  </Typography>
                  
                  <Typography sx={{ mb: 1 }}><strong>Numero:</strong> {odlDetails.odlNumber}</Typography>
                  <Typography sx={{ mb: 1 }}><strong>Part Number:</strong> {odlDetails.partNumber}</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography component="span" sx={{ mr: 1 }}><strong>Stato:</strong></Typography>
                    <Chip 
                      label={odlDetails.status.replace('_', ' ')}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  
                  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {getAvailableActions(odlDetails).length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Chip 
                          label="ODL Completato" 
                          color="success"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    ) : (
                      getAvailableActions(odlDetails).map((action) => (
                        <Button
                          key={action}
                          variant="contained"
                          color={getActionColor(action) as any}
                          fullWidth
                          startIcon={getActionIcon(action)}
                          onClick={() => handleAction(action)}
                          disabled={loading}
                          sx={{ minHeight: 44 }}
                        >
                          {getActionLabel(action)}
                        </Button>
                      ))
                    )}
                  </Box>
                  
                  {loading && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <CircularProgress size={24} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {scanResult && !odlDetails && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                <CircularProgress size={48} />
                <Typography variant="body1">Caricamento dettagli ODL...</Typography>
              </Box>
            )}

            {/* Loading State */}
            {loading && !scanResult && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
                <CircularProgress size={48} />
                <Typography variant="body1">Validazione QR Code...</Typography>
              </Box>
            )}

            {/* Errori */}
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Storico Recenti */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <History />
          Scansioni Recenti
        </Typography>
        
        <List>
          {recentScans.slice(0, 10).map((scan) => (
            <ListItem key={scan.id}>
              <ListItemIcon>
                {scan.status === 'failed' ? (
                  <Close color="error" />
                ) : scan.synced ? (
                  <CheckCircle color="success" />
                ) : (
                  <CloudOff color="warning" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body1">
                      ODL {scan.odlNumber}
                    </Typography>
                    {scan.partNumber && (
                      <Typography variant="caption" color="text.secondary">
                        ({scan.partNumber})
                      </Typography>
                    )}
                    <Chip 
                      label={scan.eventType === 'ENTRY' ? 'Ingresso' : 'Uscita'}
                      size="small"
                      color={scan.eventType === 'ENTRY' ? 'success' : 'error'}
                    />
                    {scan.status === 'failed' && (
                      <Chip 
                        label="Errore"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption">
                      {new Date(scan.timestamp).toLocaleString()}
                    </Typography>
                    {scan.departmentName && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Reparto: {scan.departmentName}
                      </Typography>
                    )}
                    {scan.duration && (
                      <Typography variant="caption" sx={{ ml: 2 }}>
                        Durata: {formatTime(scan.duration)}
                      </Typography>
                    )}
                    {scan.errorMessage && (
                      <Typography variant="caption" display="block" color="error">
                        {scan.errorMessage}
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
                sx={{ textAlign: 'center', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </Paper>

      {/* Sync Manual Button */}
      {!isEffectivelyOnline && recentScans.some(s => !s.synced) && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={syncOfflineDataWithRetry}
          disabled={loading}
        >
          <Sync />
        </Fab>
      )}

      {/* Autoclave Batch Dialog */}
      <Dialog
        open={autoclaveDialog.open}
        onClose={() => setAutoclaveDialog({ open: false, batch: null, odlId: '' })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Avanzamento Batch Autoclave</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            L'ODL appartiene al batch <strong>{autoclaveDialog.batch?.loadNumber}</strong> 
            {' '}(stato: <strong>{autoclaveDialog.batch?.status}</strong>).
          </Typography>
          <Typography variant="body1">
            Vuoi avanzare l&apos;intero batch al prossimo stato?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Questo influenzerà tutti i {autoclaveDialog.batch?.odlCount} ODL del batch.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutoclaveDialog({ open: false, batch: null, odlId: '' })}>
            Annulla
          </Button>
          <Button onClick={advanceBatchFromScan} variant="contained">
            Avanza Batch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog di conferma per azioni QR */}
      <Dialog
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
      >
        <DialogTitle>Conferma Registrazione QR</DialogTitle>
        <DialogContent>
          <Typography>
            {pendingAction ? `Registrare ${getActionLabel(pendingAction.action)} per ODL ${odlDetails?.odlNumber}?` : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingAction(null)}>Annulla</Button>
          <Button onClick={confirmAction} variant="contained" color="warning">
            Conferma
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar per notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}