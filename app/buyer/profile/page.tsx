"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"

import { BuyerLayout } from "@/components/buyer-layout"
import { AddressList } from "@/components/ui/address-list"
import type { Address } from "@/lib/user-profile-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getProfile, uploadAvatar, updateProfile, getAddresses, getRatings, Rating } from "@/lib/user-profile-service"
import { getAvatarUrl } from "@/lib/utils"

export default function BuyerProfilePage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

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
          setFullName(p.fullName || "")
          setEmail(p.email || "")
          if (typeof (p as any).twoFactorEnabled !== "undefined") setTwoFactorEnabled(!!(p as any).twoFactorEnabled)
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

  const onChoosePhoto = () => {
    fileInputRef.current?.click()
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarUploading(true)
    const uploadedUrl = await uploadAvatar(file)
    setAvatarUploading(false)
    if (uploadedUrl) {
      toast({ title: "Avatar updated" })
      setProfile((prev: any) => ({ ...(prev || {}), avatarUrl: uploadedUrl }))
    } else {
      toast({ title: "Failed to upload avatar", variant: "destructive" })
    }
  }

  const onSaveProfile = async () => {
    const payload = { fullName, email }
    const updated = await updateProfile(payload)
    if (updated) {
      toast({ title: "Profile updated" })
      setProfile(updated)
    } else {
      toast({ title: "Failed to update profile", variant: "destructive" })
    }
  }
  return (
    <BuyerLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <h1 className="text-3xl font-bold text-foreground">Profile and Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Profile Information</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview || getAvatarUrl(profile?.avatarUrl) || "/placeholder.svg?height=80&width=80"} />
                  <AvatarFallback>{(profile?.fullName || "").slice(0, 2).toUpperCase() || "NA"}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                  <Button variant="outline" onClick={onChoosePhoto} disabled={avatarUploading}>
                    {avatarUploading ? "Uploading..." : "Change Photo"}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="fullName" className="text-muted-foreground">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={onSaveProfile}>
                Update Profile
              </Button>
            </div>
          </div>

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

        <div className="flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8">Save All Changes</Button>
        </div>
      </div>
    </BuyerLayout>
  )
}


