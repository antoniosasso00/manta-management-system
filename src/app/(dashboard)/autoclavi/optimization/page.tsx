import { Metadata } from 'next';
import { Container, Typography, Box, Paper, Alert } from '@mui/material';
import { AutoModeOutlined } from '@mui/icons-material';
import { auth } from '@/lib/auth-node';
import { redirect } from 'next/navigation';
import { ODLService } from '@/domains/core/services/ODLService';
import { AutoclaveService } from '@/domains/autoclave/services/autoclave-service';
import { OptimizationWizard } from '@/components/autoclavi/optimization/OptimizationWizard';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Ottimizzazione Batch Autoclavi | MES Aerospazio',
  description: 'Sistema di ottimizzazione automatica per batch autoclavi',
};

export default async function OptimizationPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  // Verifica permessi (solo supervisor e admin)
  if (session.user.role === 'OPERATOR') {
    redirect('/autoclavi');
  }

  try {
    // Recupera ODL disponibili per ottimizzazione
    const availableODLs = await prisma.oDL.findMany({
      where: {
        OR: [
          { status: 'IN_AUTOCLAVE' },
          { status: 'CLEANROOM_COMPLETED' }
        ],
        part: {
          partTools: {
            some: {} // Ha almeno un tool associato
          }
        }
      },
      include: {
        part: {
          include: {
            partTools: {
              include: {
                tool: true
              }
            },
            defaultCuringCycle: true
          }
        },
      }
    });

    // Recupera autoclavi attive
    const availableAutoclaves = await AutoclaveService.findAllActive();

    // Verifica servizio di ottimizzazione
    let optimizationServiceAvailable = false;
    try {
      const healthCheck = await fetch(
        `${process.env.NEXT_PUBLIC_OPTIMIZATION_SERVICE_URL || 'http://localhost:8000/api/v1'}/health`
      );
      optimizationServiceAvailable = healthCheck.ok;
    } catch (error) {
      console.error('Servizio ottimizzazione non disponibile:', error);
    }

    return (
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <AutoModeOutlined fontSize="large" color="primary" />
            <Typography variant="h4" component="h1">
              Ottimizzazione Batch Autoclavi
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Sistema intelligente di ottimizzazione multi-autoclave con algoritmi di nesting avanzati
          </Typography>
        </Box>

        {!optimizationServiceAvailable && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Il servizio di ottimizzazione non è disponibile. Verifica che il microservizio sia in esecuzione su {process.env.NEXT_PUBLIC_OPTIMIZATION_SERVICE_URL || 'http://localhost:8000'}.
            </Typography>
          </Alert>
        )}

        {availableODLs.length === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Nessun ODL disponibile per l'ottimizzazione. Gli ODL devono essere nello stato IN_AUTOCLAVE o CLEANROOM_COMPLETED e avere tool associati.
            </Typography>
          </Alert>
        )}

        {availableAutoclaves.length === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Nessun autoclave attiva trovata. Contatta l'amministratore per configurare le autoclavi.
            </Typography>
          </Alert>
        )}

        {optimizationServiceAvailable && availableODLs.length > 0 && availableAutoclaves.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <OptimizationWizard
              availableODLs={availableODLs}
              availableAutoclaves={availableAutoclaves}
            />
          </Paper>
        )}
      </Container>
    );
  } catch (error) {
    console.error('Errore caricamento dati ottimizzazione:', error);
    
    return (
      <Container maxWidth="xl">
        <Alert severity="error">
          <Typography variant="body2">
            Si è verificato un errore durante il caricamento dei dati. Riprova più tardi.
          </Typography>
        </Alert>
      </Container>
    );
  }
}