"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"

import { TravelerLayout } from "@/components/traveler-layout"
import { AddressList } from "@/components/ui/address-list"
import type { Address } from "@/lib/user-profile-service"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ProfileInfoSection } from "@/components/ui/profile-info-section"
import { getProfile, uploadAvatar, updateProfile, getAddresses, getRatings, Rating } from "@/lib/user-profile-service"

export default function TravelerProfilePage() {
  const { toast } = useToast()
  const { refreshUser } = useAuth()
  const [profile, setProfile] = useState<any>(null)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [fetchingAddresses, setFetchingAddresses] = useState(true)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [fetchingRatings, setFetchingRatings] = useState(true)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        const [p, addrs, rts] = await Promise.all([getProfile(), getAddresses(), getRatings()])
        if (!mounted) return
        if (p) {
          setProfile(p)
        }
        setAddresses(addrs)
        setRatings(rts || [])
        setFetchingAddresses(false)
        setFetchingRatings(false)
      })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <TravelerLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <h1 className="text-3xl font-bold text-foreground">Profile and Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <ProfileInfoSection
            profile={profile}
            onProfileUpdated={async (updated) => {
              setProfile(updated)
              // Refresh user in AuthContext to update navigation avatar dynamically
              await refreshUser()
            }}
          />

          {/* Password Reset Card */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Password & Security</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                To reset your password securely, please use our password reset flow which will send a verification code to your email.
              </p>
              <Link href="/forgot-password">
                <Button variant="outline" className="w-full">
                  Reset Password
                </Button>
              </Link>

            </div>
          </div>



          {/* Address List */}
          <div className="bg-card rounded-lg border p-6">
            <AddressList
              addresses={addresses}
              onAddressAdded={(addr) => setAddresses(prev => [...prev, addr])}
              onAddressDeleted={(id) => setAddresses(prev => prev.filter(a => a.id !== id))}
              onAddressUpdated={(id, updated) => setAddresses(prev => prev.map(a =>
                a.id === id ? { ...a, ...updated } : a
              ))}
              onDefaultChanged={(id) => setAddresses(prev => prev.map(a => ({
                ...a,
                isDefault: a.id === id,
              })))}
            />
          </div>

        </div>
      </div>
    </TravelerLayout>
  )
}


