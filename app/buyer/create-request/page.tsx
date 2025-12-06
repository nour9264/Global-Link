"use client"

import type React from "react"
import { useState } from "react"
import { BuyerLayout } from "@/components/buyer-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import apiClient from "@/lib/api-client"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

export default function BuyerCreateRequestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Backend fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [itemValue, setItemValue] = useState<string>("")
  const [fromCountry, setFromCountry] = useState("")
  const [fromCity, setFromCity] = useState("")
  const [toCountry, setToCountry] = useState("")
  const [toCity, setToCity] = useState("")
  const [targetArrivalDate, setTargetArrivalDate] = useState("")
  const [budgetMax, setBudgetMax] = useState<string>("")
  const [estimatedTotalWeightKg, setEstimatedTotalWeightKg] = useState<string>("")
  const [isFragile, setIsFragile] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages: string[] = []
      const newFiles: File[] = []
      Array.from(files).forEach((file) => {
        if (newFiles.length + uploadedFiles.length >= 5) {
          return
        }
        newFiles.push(file)
        const reader = new FileReader()
        reader.onloadend = () => {
          newImages.push(reader.result as string)
          if (newImages.length === files.length) {
            setUploadedImages((prev) => [...prev, ...newImages].slice(0, 5))
            setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, 5))
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCancel = () => {
    router.push("/buyer")
  }

  const handleSubmit = async () => {
    // Basic required validations
    if (!title.trim() || !fromCountry.trim() || !fromCity.trim() || !toCountry.trim() || !toCity.trim()) {
      toast({
        title: "Missing required information",
        description: "Please fill Title, FromCountry, FromCity, ToCountry and ToCity.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append("Title", title)
      if (description) formData.append("Description", description)
      if (category) formData.append("Category", category)
      if (itemValue) formData.append("ItemValue", String(parseFloat(itemValue)))
      formData.append("FromCountry", fromCountry)
      formData.append("FromCity", fromCity)
      formData.append("ToCountry", toCountry)
      formData.append("ToCity", toCity)
      if (targetArrivalDate) formData.append("TargetArrivalDate", new Date(targetArrivalDate).toISOString())
      if (budgetMax) formData.append("BudgetMax", String(parseFloat(budgetMax)))
      if (estimatedTotalWeightKg) formData.append("EstimatedTotalWeightKg", String(parseFloat(estimatedTotalWeightKg)))
      formData.append("IsFragile", String(isFragile))

      // Optionally include photos if backend supports it (field name 'Photos')
      uploadedFiles.forEach((file, idx) => {
        formData.append("Photos", file, file.name || `photo_${idx + 1}.jpg`)
      })

      // Send the multipart form with photos
      const response = await apiClient.post("/api/BuyerRequest", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      // Debug: log full server response so we can see if photo URLs are returned
      console.log("📤 [CreateRequest] POST /api/BuyerRequest response:", response)
      console.log("📤 [CreateRequest] response.data:", response.data)

      toast({
        title: "Request created",
        description: "Your delivery request has been posted successfully.",
      })
      router.push("/buyer/requests")
    } catch (err: any) {
      const message = err?.message || "Failed to create request."
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      console.error("Create BuyerRequest error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BuyerLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a New Delivery Request</h1>
            <p className="text-gray-600">
              Fill out the details below to post your delivery request and connect with travelers across the globe.
              Please provide accurate information for a smooth delivery process.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Item Details */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Provide a clear description and photos of the item you need delivered.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Apple MacBook Pro 16-inch"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemDescription">Description</Label>
                    <Textarea
                      id="itemDescription"
                      placeholder="Provide detailed specifications, color, condition, etc."
                      rows={4}
                      className="resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        placeholder="e.g., Electronics"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="itemValue">Item Value (USD)</Label>
                      <Input
                        id="itemValue"
                        type="number"
                        inputMode="decimal"
                        placeholder="e.g., 1200"
                        value={itemValue}
                        onChange={(e) => setItemValue(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budgetMax">Budget Max (USD)</Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        inputMode="decimal"
                        placeholder="e.g., 50"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Estimated Total Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        inputMode="decimal"
                        placeholder="e.g., 2.5"
                        value={estimatedTotalWeightKg}
                        onChange={(e) => setEstimatedTotalWeightKg(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <Switch id="fragile" checked={isFragile} onCheckedChange={setIsFragile} />
                    <Label htmlFor="fragile" className="cursor-pointer">Is Fragile</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Item Photos (Up to 5)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        id="photoUpload"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <label htmlFor="photoUpload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Drag & drop photos here, or click to browse</p>
                        <Button type="button" variant="outline" size="sm" className="mt-2 bg-transparent">
                          Upload Photos
                        </Button>
                      </label>
                    </div>

                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-5 gap-2 mt-4">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={image || "/placeholder.svg"}
                              alt={`Upload ${index + 1}`}
                              width={80}
                              height={80}
                              className="w-full h-20 object-cover rounded border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Keep right column card below for routing and timeline */}
            </div>

            {/* Right Column - Route & Delivery Timeline */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Route & Delivery Timeline</h2>
                <p className="text-sm text-gray-600 mb-4">Specify where and when your item needs to be delivered.</p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromCountry">From Country</Label>
                    <Input
                      id="fromCountry"
                      placeholder="e.g., USA"
                      value={fromCountry}
                      onChange={(e) => setFromCountry(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromCity">From City</Label>
                    <Input
                      id="fromCity"
                      placeholder="e.g., New York"
                      value={fromCity}
                      onChange={(e) => setFromCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="toCountry">To Country</Label>
                    <Input
                      id="toCountry"
                      placeholder="e.g., United Kingdom"
                      value={toCountry}
                      onChange={(e) => setToCountry(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="toCity">To City</Label>
                    <Input
                      id="toCity"
                      placeholder="e.g., London"
                      value={toCity}
                      onChange={(e) => setToCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryDeadline">Target Arrival Date</Label>
                    <Input
                      id="deliveryDeadline"
                      type="date"
                      value={targetArrivalDate}
                      onChange={(e) => setTargetArrivalDate(e.target.value)}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" size="lg" onClick={handleCancel}>
              Cancel
            </Button>
            <Button className="bg-[#0088cc] hover:bg-[#0077b3]" size="lg" onClick={handleSubmit} disabled={submitting}>
              Create Request
            </Button>
          </div>
        </div>
      </div>
    </BuyerLayout>
  )
}
