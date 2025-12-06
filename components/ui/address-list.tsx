"use client"

import { useState } from "react"
import { Plus, Check, Trash2, PencilIcon } from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"
import { Card } from "./card"
import type { Address } from "@/lib/user-profile-service"
import { useToast } from "@/hooks/use-toast"
import { addAddress, setDefaultAddress, deleteAddress, updateAddress } from "@/lib/user-profile-service"

interface AddressListProps {
  addresses: Address[]
  onAddressAdded: (address: Address) => void
  onAddressDeleted: (addressId: string) => void
  onAddressUpdated: (addressId: string, address: Address) => void
  onDefaultChanged: (addressId: string) => void
}

export function AddressList({ addresses, onAddressAdded, onAddressDeleted, onAddressUpdated, onDefaultChanged }: AddressListProps) {
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedAddressId, setEditedAddressId] = useState<string | null>(null)
  const [editAddress, setEditAddress] = useState<Address>({})
  const [defaultingId, setDefaultingId] = useState<string | null>(null)
  const [newAddress, setNewAddress] = useState({
    label: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "",
    postalCode: "",
  })

  const handleAdd = async () => {
    // Basic validation - list missing required fields
    const missing: string[] = []
    if (!newAddress.addressLine1) missing.push('Street address')
    if (!newAddress.city) missing.push('City')
    if (!newAddress.country) missing.push('Country')
    if (missing.length) {
      toast({
        title: 'Missing required fields',
        description: `Please enter: ${missing.join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    try {
      const added = await addAddress(newAddress)
      if (added) {
        toast({ title: "Address added" })
        onAddressAdded(added)
        setIsAdding(false)
        setNewAddress({
          label: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          country: "",
          postalCode: "",
        })
      } else {
        toast({
          title: "Failed to add address",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Add address error:", err)
      toast({
        title: "Failed to add address",
        variant: "destructive",
      })
    }
  }

  const handleSetDefault = async (addressId: string) => {
    setDefaultingId(addressId)
    try {
      const success = await setDefaultAddress(addressId)
      if (success) {
        onDefaultChanged(addressId)
        toast({ title: "Default address updated" })
      } else {
        toast({
          title: "Failed to update default address",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error('Set default address error:', err)
      toast({
        title: 'Failed to update default address',
        variant: 'destructive',
      })
    } finally {
      setDefaultingId(null)
    }
  }

  const handleDelete = async (addressId: string) => {
    const success = await deleteAddress(addressId)
    if (success) {
      onAddressDeleted(addressId)
      toast({ title: "Address deleted" })
    } else {
      toast({
        title: "Failed to delete address",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (address: Address) => {
    setEditAddress(address)
    setEditedAddressId(address.id!)
    setIsEditing(true)
  }

  const handleUpdate = async () => {
    if (!editedAddressId) return

    // Basic validation - list missing required fields
    const missing: string[] = []
    if (!editAddress.addressLine1) missing.push('Street address')
    if (!editAddress.city) missing.push('City')
    if (!editAddress.country) missing.push('Country')
    if (missing.length) {
      toast({
        title: 'Missing required fields',
        description: `Please enter: ${missing.join(', ')}`,
        variant: 'destructive',
      })
      return
    }

    try {
      const updated = await updateAddress(editedAddressId, editAddress)
      if (updated) {
        toast({ title: "Address updated" })
        // prefer server-returned canonical address when available
        onAddressUpdated(editedAddressId, updated)
        setIsEditing(false)
        setEditedAddressId(null)
        setEditAddress({})
      } else {
        toast({
          title: "Failed to update address",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Update address error:", err)
      toast({
        title: "Failed to update address",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">My Addresses</h3>
        <Button variant="outline" onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
      </div>

      {/* New Address Form */}
      {isAdding && (
        <Card className="p-4 mb-4">
          <h4 className="font-medium mb-4">Add New Address</h4>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Label (Home, Work, etc.)"
                    value={(newAddress as any).label}
                    onChange={(e) => setNewAddress((prev) => ({ ...prev, label: e.target.value }))}
              />
            </div>
            <div>
              <Input
                placeholder="Street Address"
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress((prev) => ({ ...prev, addressLine1: e.target.value }))}
                    aria-invalid={!newAddress.addressLine1 && isAdding}
                    className={!newAddress.addressLine1 && isAdding ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Input
                placeholder="Apartment, Suite, etc. (optional)"
                value={newAddress.addressLine2}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, addressLine2: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="City"
                value={newAddress.city}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
                aria-invalid={!newAddress.city && isAdding}
                className={!newAddress.city && isAdding ? 'border-red-500' : ''}
              />
              <Input
                placeholder="Country"
                value={newAddress.country}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, country: e.target.value }))}
                aria-invalid={!newAddress.country && isAdding}
                className={!newAddress.country && isAdding ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Input
                placeholder="Postal Code"
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!newAddress.addressLine1 || !newAddress.city || !newAddress.country}>
                Add Address
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Address Form */}
      {isEditing && editedAddressId && (
        <Card className="p-4 mb-4">
          <h4 className="font-medium mb-4">Edit Address</h4>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Label (Home, Work, etc.)"
                value={(editAddress as any).label || ""}
                onChange={(e) => setEditAddress((prev) => ({ ...prev, label: e.target.value }))}
              />
            </div>
            <div>
              <Input
                placeholder="Street Address"
                value={editAddress.addressLine1}
                onChange={(e) => setEditAddress((prev) => ({ ...prev, addressLine1: e.target.value }))}
                aria-invalid={!editAddress.addressLine1 && isEditing}
                className={!editAddress.addressLine1 && isEditing ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Input
                placeholder="Apartment, Suite, etc. (optional)"
                value={editAddress.addressLine2}
                onChange={(e) => setEditAddress((prev) => ({ ...prev, addressLine2: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="City"
                value={editAddress.city}
                onChange={(e) => setEditAddress((prev) => ({ ...prev, city: e.target.value }))}
                aria-invalid={!editAddress.city && isEditing}
                className={!editAddress.city && isEditing ? 'border-red-500' : ''}
              />
              <Input
                placeholder="Country"
                value={editAddress.country}
                onChange={(e) => setEditAddress((prev) => ({ ...prev, country: e.target.value }))}
                aria-invalid={!editAddress.country && isEditing}
                className={!editAddress.country && isEditing ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Input
                placeholder="Postal Code"
                value={editAddress.postalCode}
                onChange={(e) => setEditAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditing(false)
                setEditedAddressId(null)
                setEditAddress({})
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!editAddress.addressLine1 || !editAddress.city || !editAddress.country}>
                Update Address
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Address List */}
      {addresses.length === 0 && !isAdding ? (
        <p className="text-gray-500 text-center py-4">No addresses added yet</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card key={address.id} className={`p-4 ${address.isDefault ? "border-blue-500" : ""}`}>
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{address.addressLine1}</p>
                    {(address as any).label && (
                      <span className="text-xs text-gray-500 px-2 py-0.5 rounded bg-gray-100">{(address as any).label}</span>
                    )}
                  </div>
                  {address.addressLine2 && <p className="text-gray-600">{address.addressLine2}</p>}
                  <p className="text-gray-600">
                    {address.city}, {address.country} {address.postalCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!address.isDefault && (
                    <Button variant="ghost" onClick={() => handleSetDefault(address.id!)} disabled={defaultingId === address.id} aria-busy={defaultingId === address.id}>
                      <Check className="h-4 w-4 mr-1" />
                      {defaultingId === address.id ? 'Setting...' : 'Set Default'}
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => handleEdit(address)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="text-red-600" onClick={() => handleDelete(address.id!)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}