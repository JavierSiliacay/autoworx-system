import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import React from "react"

export const playORCRReminder = () => {
    // Play the voice notification
    const audio = new Audio("/voice.mp3")
    audio.play().catch(e => console.log("Audio notification blocked by browser settings", e))

    // Show the toast notification with an OK button to close
    const { dismiss } = toast({
        title: "Note from Autoworx",
        description: "Please ensure all vehicle details match your OR/CR exactly. This helps our team verify your information quickly.",
        duration: 5000,
        action: (
            <ToastAction altText="Click OK to dismiss" onClick={() => dismiss()}>
                OK
            </ToastAction>
        ),
    })
}
