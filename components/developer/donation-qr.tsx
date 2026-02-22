"use client"

import React from "react"
import Image from "next/image"

export function DonationQR() {
    const [imageError, setImageError] = React.useState(false)

    return (
        <div className="w-48 h-48 bg-white rounded-lg p-2 shadow-inner group relative">
            {!imageError && (
                <Image
                    src="/gcash-qr.png"
                    alt="GCash QR Code"
                    width={192}
                    height={192}
                    className="w-full h-full object-contain rounded"
                    onError={() => setImageError(true)}
                />
            )}

            {imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-600 p-4 text-center">
                    <div className="w-12 h-12 mb-2 opacity-20">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm10 0h2v2h-2v-2zm2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm-2 2h2v-2h-2v2zm0-4V13h2v2h-2zm2-2h2v2h-2v-2zM15 15h2v2h-2v-2z" /></svg>
                    </div>
                    <p className="text-[10px] font-bold leading-tight opacity-60">
                        REPLACE WITH<br />QR CODE IMAGE
                    </p>
                </div>
            )}

            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <span className="text-white text-xs font-bold uppercase tracking-widest text-center px-4">
                    Scan to Support via GCash
                </span>
            </div>
        </div>
    )
}
