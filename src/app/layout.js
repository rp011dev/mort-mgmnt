'use client'

import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import { UserProvider } from '../context/UserContext'
import ConditionalNavigation from '../components/ConditionalNavigation'
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>GK Finance - Mortgages & Insurance</title>
        <meta name="description" content="Professional mortgage and insurance services - manage customer journey from enquiry to offer" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" />
      </head>
      <body>
        <UserProvider>
          <ConditionalNavigation />
          <main>{children}</main>
        </UserProvider>
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}