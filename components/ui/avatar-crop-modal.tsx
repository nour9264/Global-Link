"use client"

import React, { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn } from "lucide-react"

interface AvatarCropModalProps {
    open: boolean
    imageSrc: string
    onClose: () => void
    onCropComplete: (croppedImageBlob: Blob) => void
}

interface CropArea {
    x: number
    y: number
    width: number
    height: number
}

export function AvatarCropModal({ open, imageSrc, onClose, onCropComplete }: AvatarCropModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)

    const onCropChange = useCallback((crop: { x: number; y: number }) => {
        setCrop(crop)
    }, [])

    const onZoomChange = useCallback((zoom: number) => {
        setZoom(zoom)
    }, [])

    const onCropCompleteCallback = useCallback(
        (_croppedArea: CropArea, croppedAreaPixels: CropArea) => {
            setCroppedAreaPixels(croppedAreaPixels)
        },
        []
    )

    const handleSave = useCallback(async () => {
        if (!croppedAreaPixels) return

        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            onCropComplete(croppedBlob)
            onClose()
        } catch (error) {
            console.error("Error cropping image:", error)
        }
    }, [croppedAreaPixels, imageSrc, onCropComplete, onClose])

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Crop Avatar</DialogTitle>
                </DialogHeader>

                <div className="relative h-80 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropCompleteCallback}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <ZoomIn className="w-4 h-4 text-muted-foreground" />
                        <Slider
                            value={[zoom]}
                            onValueChange={(value) => setZoom(value[0])}
                            min={1}
                            max={3}
                            step={0.1}
                            className="flex-1"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-[#0088cc] hover:bg-[#0077b3]">
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Helper function to crop the image
async function getCroppedImg(imageSrc: string, cropArea: CropArea): Promise<Blob> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
        throw new Error("No 2d context")
    }

    // Set canvas size to match the crop area
    canvas.width = cropArea.width
    canvas.height = cropArea.height

    // Draw the cropped image
    ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
    )

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Canvas is empty"))
                return
            }
            resolve(blob)
        }, "image/jpeg", 0.95)
    })
}

// Helper function to create an image element
function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener("load", () => resolve(image))
        image.addEventListener("error", (error) => reject(error))
        image.src = url
    })
}
