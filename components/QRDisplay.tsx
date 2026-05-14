'use client'
import { QRCodeSVG } from 'qrcode.react'

export default function QRDisplay({ url }: { url: string }) {
  return (
    <div className="bg-white p-4 rounded-xl inline-block">
      <QRCodeSVG
        value={url}
        size={160}
        bgColor="#ffffff"
        fgColor="#0D1F0F"
        level="H"
      />
    </div>
  )
}
