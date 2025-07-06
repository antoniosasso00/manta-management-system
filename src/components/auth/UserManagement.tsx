'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectItem,
  Pagination,
  Card,
  CardContent,
  Checkbox,
  Toolbar,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Search as SearchIcon,
  // FilterList as FilterIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { UserRole, DepartmentRole, DepartmentType } from '@prisma/client'
import { UserForm } from './UserForm'
import { UserImport } from './UserImport'
import { RoleBadge } from '@/components/atoms'

interface Department {
  id: string
  name: string
  code: string
  type: DepartmentType
}

interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  departmentId: string | null
  departmentRole: DepartmentRole | null
  createdAt: string
  isActive: boolean
  department?: Department | null
}

interface UserFilters {
  search: string
  role: string
  departmentId: string
  status: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function UserManagement() {
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
  
  // States
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  
  // Filters and pagination
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    departmentId: '',
    status: ''
  })
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  // Bulk operations
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value
          return acc
        }, {} as Record<string, string>)
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
      } else {
        setError('Errore nel caricamento degli utenti')
      }
    } catch {
      setError('Errore di connessione')
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.limit])
  
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments || [])
      }
    } catch {
      // Silently fail - departments are optional for filtering
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
  }, [fetchUsers, fetchDepartments])
  
  useEffect(() => {
    fetchUsers()
  }, [filters, pagination.page, pagination.limit, fetchUsers])

  const handleCreateUser = () => {
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setDialogOpen(true)
    setMenuAnchor(null)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchUsers()
        setDeleteDialogOpen(false)
        setSelectedUser(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Errore durante l\'eliminazione')
      }
    } catch {
      setError('Errore di connessione')
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/toggle-status`, {
        method: 'PATCH',
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore durante l\'aggiornamento')
      }
    } catch {
      setError('Errore di connessione')
    }
    setMenuAnchor(null)
  }

  const handleUserSaved = () => {
    setDialogOpen(false)
    setSelectedUser(null)
    fetchUsers()
  }
  
  // Filter handlers
  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }
  
  const clearFilters = () => {
    setFilters({ search: '', role: '', departmentId: '', status: '' })
    setPagination(prev => ({ ...prev, page: 1 }))
  }
  
  // Pagination handlers
  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }
  
  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value)
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }
  
  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map(u => u.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }
  
  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }
  
  // Bulk operations
  const handleBulkStatusChange = async (isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/users/bulk/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          isActive
        })
      })
      
      if (response.ok) {
        setSelectedUsers(new Set())
        fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore durante l\'operazione bulk')
      }
    } catch {
      setError('Errore di connessione')
    }
    setBulkMenuAnchor(null)
  }
  
  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/admin/users/bulk/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers)
        })
      })
      
      if (response.ok) {
        setSelectedUsers(new Set())
        fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Errore durante l\'eliminazione bulk')
      }
    } catch {
      setError('Errore di connessione')
    }
    setBulkMenuAnchor(null)
  }
  
  // Export/Import handlers
  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/users/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `utenti_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError('Errore durante l\'export')
      }
    } catch {
      setError('Errore di connessione')
    }
  }


  const openMenu = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setMenuAnchor(event.currentTarget)
    setSelectedUser(user)
  }

  const closeMenu = () => {
    setMenuAnchor(null)
    setSelectedUser(null)
  }
  
  // const openBulkMenu = (event: React.MouseEvent<HTMLElement>) => {
  //   setBulkMenuAnchor(event.currentTarget)
  // }
  
  const closeBulkMenu = () => {
    setBulkMenuAnchor(null)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Caricamento utenti...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 items-center">
            <Box className="col-span-1 sm:col-span-1 md:col-span-3">
              <TextField
                fullWidth
                label="Cerca"
                placeholder="Nome, email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
              />
            </Box>
            <Box className="col-span-1 sm:col-span-1 md:col-span-2">
              <FormControl fullWidth size="small">
                <InputLabel>Ruolo</InputLabel>
                <Select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  label="Ruolo"
                >
                  <SelectItem value="">Tutti</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisore</SelectItem>
                  <SelectItem value="OPERATOR">Operatore</SelectItem>
                </Select>
              </FormControl>
            </Box>
            <Box className="col-span-1 sm:col-span-1 md:col-span-2">
              <FormControl fullWidth size="small">
                <InputLabel>Reparto</InputLabel>
                <Select
                  value={filters.departmentId}
                  onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                  label="Reparto"
                >
                  <SelectItem value="">Tutti</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {getDepartmentTypeIcon(dept.type)} {dept.code}
                    </SelectItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box className="col-span-1 sm:col-span-1 md:col-span-2">
              <FormControl fullWidth size="small">
                <InputLabel>Stato</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Stato"
                >
                  <SelectItem value="">Tutti</SelectItem>
                  <SelectItem value="active">Attivi</SelectItem>
                  <SelectItem value="inactive">Disattivati</SelectItem>
                </Select>
              </FormControl>
            </Box>
            <Box className="col-span-1 sm:col-span-1 md:col-span-2">
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                size="small"
              >
                Pulisci
              </Button>
            </Box>
            <Box className="col-span-1 sm:col-span-1 md:col-span-1">
              <Box display="flex" gap={1}>
                <Tooltip title="Esporta utenti">
                  <IconButton onClick={handleExport} color="primary">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Importa utenti">
                  <IconButton onClick={() => setImportDialogOpen(true)} color="primary">
                    <UploadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedUsers.size > 0 && (
        <Paper sx={{ mb: 2 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {selectedUsers.size} utenti selezionati
            </Typography>
            <Button
              startIcon={<CheckCircleIcon />}
              onClick={() => handleBulkStatusChange(true)}
              color="success"
              sx={{ mr: 1 }}
            >
              Attiva
            </Button>
            <Button
              startIcon={<CancelIcon />}
              onClick={() => handleBulkStatusChange(false)}
              color="warning"
              sx={{ mr: 1 }}
            >
              Disattiva
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
              color="error"
            >
              Elimina
            </Button>
          </Toolbar>
        </Paper>
      )}

      {/* Users Table */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedUsers.size > 0 && selectedUsers.size < users.length}
                    checked={users.length > 0 && selectedUsers.size === users.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Ruolo Sistema</TableCell>
                <TableCell>Reparto</TableCell>
                <TableCell>Ruolo Reparto</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Data Creazione</TableCell>
                <TableCell width={100}>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} selected={selectedUsers.has(user.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" color="action" />
                      {user.name || 'Nome non specificato'}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <RoleBadge 
                      role={user.role} 
                      variant="system"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.department ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {getDepartmentTypeIcon(user.department.type)} {user.department.code}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.departmentRole ? (
                      <RoleBadge 
                        role={user.role}
                        departmentRole={user.departmentRole}
                        variant="department"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Attivo' : 'Disattivato'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                      icon={user.isActive ? <LockOpenIcon /> : <LockIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => openMenu(e, user)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary" py={4}>
                      {loading ? 'Caricamento...' : 'Nessun utente trovato'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Mostra
            </Typography>
            <TextField
              select
              size="small"
              value={pagination.limit}
              onChange={handleLimitChange}
              sx={{ minWidth: 80 }}
            >
              <SelectItem value={10}>10</SelectItem>
              <SelectItem value={25}>25</SelectItem>
              <SelectItem value={50}>50</SelectItem>
              <SelectItem value={100}>100</SelectItem>
            </TextField>
            <Typography variant="body2" color="text.secondary">
              di {pagination.total} utenti
            </Typography>
          </Box>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        <MenuItem onClick={() => handleEditUser(selectedUser!)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifica</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleToggleStatus(selectedUser!)}>
          <ListItemIcon>
            {selectedUser?.isActive ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedUser?.isActive ? 'Disattiva' : 'Attiva'}
          </ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setDeleteDialogOpen(true)
            closeMenu()
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Elimina</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={closeBulkMenu}
      >
        <MenuItem onClick={() => handleBulkStatusChange(true)}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Attiva selezionati</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkStatusChange(false)}>
          <ListItemIcon>
            <CancelIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Disattiva selezionati</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleBulkDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Elimina selezionati</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add User FAB */}
      <Fab
        color="primary"
        aria-label="add user"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreateUser}
      >
        <AddIcon />
      </Fab>

      {/* User Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Modifica Utente' : 'Nuovo Utente'}
        </DialogTitle>
        <DialogContent>
          <UserForm
            user={selectedUser}
            onSave={handleUserSaved}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare l&apos;utente <strong>{selectedUser?.name || selectedUser?.email}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Questa azione non può essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* User Import Dialog */}
      <UserImport
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={() => {
          setImportDialogOpen(false)
          fetchUsers()
        }}
      />
    </Box>
  )
}