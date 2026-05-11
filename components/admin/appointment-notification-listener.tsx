"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function AppointmentNotificationListener() {
    const { toast } = useToast()
    const supabase = createClient()

    useEffect(() => {
        const playSound = () => {
            const audio = new Audio("/appointment.mp3")
            audio.play().catch(e => {
                console.warn("Audio notification blocked or failed. User interaction might be required.", e)
            })
        }

        // 1. Listen for new incoming customer appointments
        const appointmentsChannel = supabase
            .channel('realtime_appointments_notification')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'appointments'
                },
                (payload) => {
                    console.log('New appointment received:', payload)
                    playSound()
                    toast({
                        title: "🔔 New Appointment Request",
                        description: `${payload.new.name} has submitted a new appointment.`,
                        duration: 10000,
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(appointmentsChannel)
        }
    }, [supabase, toast])

    return null
}
