'use client'

import { 
  Card, 
  CardContent, 
  Box, 
  Typography, 
  Avatar, 
  Divider,
  Chip,
} from '@mui/material'
import { 
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
} from '@mui/icons-material'
import { UserRole, DepartmentRole, DepartmentType } from '@prisma/client'
import { RoleBadge } from '@/components/atoms'

interface Department {
  id: string
  name: string
  code: string
  type: DepartmentType
}

export interface UserInfoCardProps {
  user: {
    id: string
    name: string | null
    email: string
    role: UserRole
    departmentId?: string | null
    departmentRole?: DepartmentRole | null
    isActive: boolean
    createdAt: string
    department?: Department | null
  }
  showActions?: boolean
  compact?: boolean
}

export function UserInfoCard({ 
  user, 
  showActions = false, 
  compact = false 
}: UserInfoCardProps) {
  
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase()
    }
    return email.charAt(0).toUpperCase()
  }

  const getDepartmentTypeIcon = (type: DepartmentType) => {
    const icons: Record<DepartmentType, string> = {
      [DepartmentType.CLEANROOM]: '🧪',
      [DepartmentType.AUTOCLAVE]: '🔥',
      [DepartmentType.NDI]: '🔍',
      [DepartmentType.HONEYCOMB]: '🍯',
      [DepartmentType.CONTROLLO_NUMERICO]: '⚙️',
      [DepartmentType.MONTAGGIO]: '🔧',
      [DepartmentType.VERNICIATURA]: '🎨',
      [DepartmentType.MOTORI]: '🚀',
      [DepartmentType.CONTROLLO_QUALITA]: '✅',
      [DepartmentType.OTHER]: '📋',
    }
    return icons[type] || '📋'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: compact ? 2 : 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Avatar */}
          <Avatar
            sx={{ 
              width: compact ? 40 : 56, 
              height: compact ? 40 : 56,
              bgcolor: user.isActive ? 'primary.main' : 'grey.500'
            }}
          >
            {getInitials(user.name, user.email)}
          </Avatar>

          {/* Informazioni Utente */}
          <Box sx={{ flexGrow: 1 }}>
            {/* Nome e Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant={compact ? 'h6' : 'h5'} component="div">
                {user.name || 'Nome non specificato'}
              </Typography>
              <Chip
                label={user.isActive ? 'Attivo' : 'Disattivato'}
                color={user.isActive ? 'success' : 'default'}
                size="small"
              />
            </Box>

            {/* Email */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>

            {/* Ruoli */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <RoleBadge 
                role={user.role} 
                departmentRole={user.departmentRole}
                variant="system"
              />
              {user.departmentRole && (
                <RoleBadge 
                  role={user.role} 
                  departmentRole={user.departmentRole}
                  variant="department"
                />
              )}
            </Box>

            {/* Informazioni Reparto */}
            {user.department && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Reparto:</strong>
                  </Typography>
                </Box>
                <Box sx={{ mt: 1, pl: 3 }}>
                  <Typography variant="body2">
                    {getDepartmentTypeIcon(user.department.type)} {user.department.code} - {user.department.name}
                  </Typography>
                </Box>
              </>
            )}

            {/* Informazioni aggiuntive in modalità non compact */}
            {!compact && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Creato il {formatDate(user.createdAt)}
                  </Typography>
                </Box>
              </>
            )}

            {/* Azioni personalizzate */}
            {showActions && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                {/* Le azioni possono essere passate come prop in futuro */}
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}