'use client'

import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material'
import { format, subDays, startOfDay } from 'date-fns'
import { it } from 'date-fns/locale'

interface AuditEvent {
  id: string
  eventType: string
  category: string
  timestamp: string
  user?: {
    id: string
    name: string
    email: string
  }
  department?: {
    name: string
    type: string
  }
}

interface AuditChartsProps {
  events: AuditEvent[]
  loading?: boolean
}

export default function AuditCharts({ events, loading = false }: AuditChartsProps) {
  const theme = useTheme()
  
  // Colori per grafici
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ]

  // Prepara dati per grafico temporale (ultimi 7 giorni)
  const getTimelineData = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 6 - i))
      return {
        date,
        dateLabel: format(date, 'dd/MM', { locale: it }),
        dayLabel: format(date, 'EEE', { locale: it }),
        fullDate: format(date, 'dd/MM/yyyy', { locale: it })
      }
    })

    return days.map(day => {
      const dayEvents = events.filter(event => {
        const eventDate = startOfDay(new Date(event.timestamp))
        return eventDate.getTime() === day.date.getTime()
      })

      const categoryCounts = {
        PRODUCTION: dayEvents.filter(e => e.category === 'PRODUCTION').length,
        AUTHENTICATION: dayEvents.filter(e => e.category === 'AUTHENTICATION').length,
        ODL_MANAGEMENT: dayEvents.filter(e => e.category === 'ODL_MANAGEMENT').length,
        SYSTEM: dayEvents.filter(e => e.category === 'SYSTEM').length,
        OTHER: dayEvents.filter(e => !['PRODUCTION', 'AUTHENTICATION', 'ODL_MANAGEMENT', 'SYSTEM'].includes(e.category)).length
      }

      return {
        date: day.dateLabel,
        day: day.dayLabel,
        fullDate: day.fullDate,
        total: dayEvents.length,
        ...categoryCounts
      }
    })
  }

  // Prepara dati per grafico distribuzione oraria
  const getHourlyData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    
    return hours.map(hour => {
      const hourEvents = events.filter(event => {
        const eventHour = new Date(event.timestamp).getHours()
        return eventHour === hour
      })

      return {
        hour: hour.toString().padStart(2, '0') + ':00',
        eventi: hourEvents.length,
        production: hourEvents.filter(e => e.category === 'PRODUCTION').length,
        authentication: hourEvents.filter(e => e.category === 'AUTHENTICATION').length,
        system: hourEvents.filter(e => e.category === 'SYSTEM').length
      }
    })
  }

  // Prepara dati per grafico categoria
  const getCategoryData = () => {
    const categories = ['PRODUCTION', 'AUTHENTICATION', 'ODL_MANAGEMENT', 'SYSTEM', 'OTHER']
    
    return categories.map(category => {
      const categoryEvents = category === 'OTHER' 
        ? events.filter(e => !categories.slice(0, -1).includes(e.category))
        : events.filter(e => e.category === category)

      return {
        name: getCategoryLabel(category),
        value: categoryEvents.length,
        percentage: events.length > 0 ? ((categoryEvents.length / events.length) * 100).toFixed(1) : '0'
      }
    }).filter(item => item.value > 0)
  }

  // Prepara dati per grafico utenti più attivi
  const getTopUsersData = () => {
    const userCounts = events.reduce((acc, event) => {
      if (event.user) {
        const userId = event.user.id
        const userName = event.user.name || event.user.email
        acc[userId] = {
          name: userName,
          count: (acc[userId]?.count || 0) + 1
        }
      }
      return acc
    }, {} as Record<string, { name: string, count: number }>)

    return Object.values(userCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(user => ({
        name: user.name.length > 20 ? user.name.substring(0, 20) + '...' : user.name,
        eventi: user.count
      }))
  }

  // Prepara dati per grafico reparti
  const getDepartmentData = () => {
    const deptCounts = events.reduce((acc, event) => {
      if (event.department) {
        const deptName = event.department.name
        acc[deptName] = (acc[deptName] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return Object.entries(deptCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        eventi: count
      }))
  }

  const timelineData = getTimelineData()
  const hourlyData = getHourlyData()
  const categoryData = getCategoryData()
  const topUsersData = getTopUsersData()
  const departmentData = getDepartmentData()

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Caricamento grafici...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* Timeline Eventi - Ultimi 7 giorni */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Andamento Eventi - Ultimi 7 giorni
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => {
                  const item = timelineData.find(d => d.date === label)
                  return item ? `${item.day} ${item.fullDate}` : label
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="PRODUCTION" 
                stackId="1" 
                stroke={colors[0]} 
                fill={colors[0]} 
                name="Produzione"
              />
              <Area 
                type="monotone" 
                dataKey="AUTHENTICATION" 
                stackId="1" 
                stroke={colors[1]} 
                fill={colors[1]} 
                name="Autenticazione"
              />
              <Area 
                type="monotone" 
                dataKey="ODL_MANAGEMENT" 
                stackId="1" 
                stroke={colors[2]} 
                fill={colors[2]} 
                name="Gestione ODL"
              />
              <Area 
                type="monotone" 
                dataKey="SYSTEM" 
                stackId="1" 
                stroke={colors[3]} 
                fill={colors[3]} 
                name="Sistema"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribuzione Oraria */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Distribuzione Oraria Eventi
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="eventi" fill={colors[0]} name="Eventi Totali" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Distribuzione per Categoria */}
        <Card sx={{ flex: 1, minWidth: 300 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distribuzione per Categoria
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 Utenti più Attivi */}
        <Card sx={{ flex: 1, minWidth: 300 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top 10 Utenti più Attivi
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topUsersData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="eventi" fill={colors[1]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Attività per Reparto */}
      {departmentData.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Attività per Reparto
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="eventi" fill={colors[2]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'PRODUCTION': 'Produzione',
    'AUTHENTICATION': 'Autenticazione',
    'ODL_MANAGEMENT': 'Gestione ODL',
    'SYSTEM': 'Sistema',
    'OTHER': 'Altro'
  }
  return labels[category] || category
}