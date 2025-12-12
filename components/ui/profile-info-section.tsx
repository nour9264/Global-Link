"use client"

import React, { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Edit, X, Check, User, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateProfile, uploadAvatar } from "@/lib/user-profile-service"
import { getAvatarUrl } from "@/lib/utils"
import type { UserProfile } from "@/lib/user-profile-service"
import { AvatarCropModal } from "@/components/ui/avatar-crop-modal"

interface ProfileInfoSectionProps {
    profile: UserProfile | null
    onProfileUpdated: (updated: UserProfile) => void
}

export function ProfileInfoSection({ profile, onProfileUpdated }: ProfileInfoSectionProps) {
    const { toast } = useToast()
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const [isEditing, setIsEditing] = useState(false)
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Crop modal state
    const [showCropModal, setShowCropModal] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    // Start editing mode
    const handleEdit = () => {
        // Parse fullName into firstName and lastName
        const names = (profile?.fullName || "").split(" ")
        setFirstName(names[0] || "")
        setLastName(names.slice(1).join(" ") || "")
        setIsEditing(true)
    }

    // Cancel editing
    const handleCancel = () => {
        setFirstName("")
        setLastName("")
        setIsEditing(false)
    }

    // Handle avatar file selection - show crop modal
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        console.log('[ProfileInfoSection] Avatar file selected:', file.name)

        // Create object URL for cropper
        const imageUrl = URL.createObjectURL(file)
        setSelectedImage(imageUrl)
        setShowCropModal(true)

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Handle cropped image upload
    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsUploadingAvatar(true)

        try {
            // Convert blob to File
            const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' })

            console.log('[ProfileInfoSection] Uploading cropped avatar...')
            const uploadedUrl = await uploadAvatar(croppedFile)
            console.log('[ProfileInfoSection] uploadAvatar returned:', uploadedUrl)

            if (uploadedUrl) {
                toast({ title: "Avatar updated successfully" })

                // Re-fetch the complete profile to get all updated data from backend
                if (uploadedUrl === 'success') {
                    const { getProfile } = await import('@/lib/user-profile-service')
                    const updatedProfile = await getProfile()
                    if (updatedProfile) {
                        console.log('[ProfileInfoSection] Fetched updated profile from backend:', updatedProfile)
                        onProfileUpdated(updatedProfile)
                    }
                } else {
                    // We got the actual URL from backend, update profile with it
                    if (profile) {
                        const updatedProfile = { ...profile, avatarUrl: uploadedUrl }
                        console.log('[ProfileInfoSection] Updating profile state with backend avatar URL:', updatedProfile)
                        onProfileUpdated(updatedProfile)
                    }
                }
            } else {
                console.error('[ProfileInfoSection] uploadAvatar returned null')
                toast({
                    title: "Failed to upload avatar",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error('[ProfileInfoSection] Exception caught:', error)
            toast({
                title: "Failed to upload avatar",
                variant: "destructive",
            })
        } finally {
            setIsUploadingAvatar(false)
            // Clean up object URL
            if (selectedImage) {
                URL.revokeObjectURL(selectedImage)
                setSelectedImage(null)
            }
        }
    }

    // Save name changes only
    const handleSave = async () => {
        if (!firstName.trim()) {
            toast({
                title: "First name is required",
                variant: "destructive",
            })
            return
        }

        setIsSaving(true)
        try {
            const updated = await updateProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            })

            if (updated) {
                toast({ title: "Name updated successfully" })
                onProfileUpdated(updated)
                setIsEditing(false)
            } else {
                toast({
                    title: "Failed to update name",
                    description: "Please try again",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Failed to update name",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    // Display mode
    if (!isEditing) {
        return (
            <>
                {/* Crop Modal */}
                {selectedImage && (
                    <AvatarCropModal
                        open={showCropModal}
                        imageSrc={selectedImage}
                        onClose={() => {
                            setShowCropModal(false)
                            URL.revokeObjectURL(selectedImage)
                            setSelectedImage(null)
                        }}
                        onCropComplete={handleCropComplete}
                    />
                )}

                {/* Profile Card */}
                <Card className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
                        <Button variant="outline" size="sm" onClick={handleEdit}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {/* Avatar with upload button */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage
                                        src={getAvatarUrl(profile?.avatarUrl) || "/placeholder.svg"}
                                    />
                                    <AvatarFallback className="bg-muted">
                                        <User className="w-12 h-12 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                                {isUploadingAvatar && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="text-2xl font-semibold text-foreground mb-1">
                                    {profile?.fullName || "No name set"}
                                </h3>
                                <p className="text-muted-foreground mb-3">{profile?.email || "No email"}</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                    disabled={isUploadingAvatar}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingAvatar}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {isUploadingAvatar ? "Uploading..." : "Change Avatar"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </>
        )
    }

    // Edit mode - Only name editing
    return (
        <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Edit Name</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-[#0088cc] hover:bg-[#0077b3]">
                        <Check className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* First Name */}
                <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        disabled={isSaving}
                        className="mt-1"
                    />
                </div>

                {/* Last Name */}
                <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        disabled={isSaving}
                        className="mt-1"
                    />
                </div>

                <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
                    <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Avatar can be changed directly from display mode. Click "Change Avatar" button without entering edit mode.
                    </p>
                </div>
            </div>
        </Card>
    )
}
