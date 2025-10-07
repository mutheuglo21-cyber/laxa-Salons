import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatTime } from "@/lib/utils"
import { Calendar, Clock, User } from "lucide-react"

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  users: { full_name: string; email: string }
  services: { name: string }
  staff: { full_name: string }
}

interface RecentAppointmentsTableProps {
  appointments: Appointment[]
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  completed: "outline",
  cancelled: "destructive",
}

export function RecentAppointmentsTable({ appointments }: RecentAppointmentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No recent appointments</p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-start justify-between gap-4 border-b pb-4 last:border-0">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{appointment.users.full_name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    {appointment.services.name} with {appointment.staff.full_name}
                  </p>
                  <div className="flex items-center gap-4 pl-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(appointment.appointment_date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(appointment.appointment_time)}
                    </div>
                  </div>
                </div>
                <Badge variant={statusVariants[appointment.status]} className="capitalize">
                  {appointment.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
