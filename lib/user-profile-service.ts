import apiClient from './api-client'

export interface UserProfile {
  id?: string
  fullName?: string
  email?: string
  avatarUrl?: string
  phone?: string
  // other fields as returned by backend
}

export interface Address {
  id?: string
  label?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  country?: string
  postalCode?: string
  isDefault?: boolean
}

export interface Rating {
  id?: string
  score?: number
  comment?: string
  reviewer?: string
  createdAt?: string
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const res = await apiClient.get('/api/UserProfile')
    return res.data || null
  } catch (err: any) {
    // Normalize and log more detailed error info safely
    const e: any = err || {}
    const safeLog = {
      message: e?.message || (typeof e === 'string' ? e : undefined) || 'Unknown error',
      errors: e?.errors || e?.response?.data?.errors || undefined,
      statusCode: e?.statusCode || e?.response?.status || undefined,
      response: e?.response?.data || undefined,
      url: e?.config?.url || undefined,
      raw: undefined as any,
    }

    try {
      // Attempt to include the raw error in a serializable way
      safeLog.raw = typeof e === 'object' ? JSON.parse(JSON.stringify(e, Object.getOwnPropertyNames(e))) : e
    } catch (serializeErr) {
      safeLog.raw = e
    }

    // Use a single console.error call with a readable object to help debugging in DevTools
    console.error('[user-profile] getProfile error', safeLog)
    return null
  }
}

export async function uploadAvatar(file: File): Promise<string | null> {
  try {
    const fd = new FormData()
    fd.append('avatar', file)
    // Do not set Content-Type for multipart/form-data, browser will set it with boundary
    const res = await apiClient.put('/api/UserProfile/avatar', fd)
    // expect backend to return { avatarUrl: '...' } or full profile
    return res.data?.avatarUrl || res.data?.data?.avatarUrl || null
  } catch (err) {
    const error = err as any
    console.error('[user-profile] uploadAvatar error', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    })
    return null
  }
}

export async function getAddresses(): Promise<Address[]> {
  try {
    const res = await apiClient.get('/api/UserProfile/addresses')
    const raw = Array.isArray(res.data)
      ? res.data
      : res.data?.data && Array.isArray(res.data.data)
      ? res.data.data
      : res.data?.$values && Array.isArray(res.data.$values)
      ? res.data.$values
      : []

    // Normalize backend address shape (line1/line2) to frontend shape (addressLine1/addressLine2)
    const mapped: Address[] = raw.map((a: any) => ({
      id: a.id || a.addressId || a.addressID || undefined,
      label: a.label || a.name || undefined,
      addressLine1: a.line1 || a.line_1 || a.addressLine1 || undefined,
      addressLine2: a.line2 || a.line_2 || a.addressLine2 || undefined,
      city: a.city || undefined,
      country: a.country || undefined,
      postalCode: a.postalCode || a.postal_code || undefined,
      isDefault: !!a.isDefault || !!a.is_default || false,
    }))

    return mapped
  } catch (err) {
    console.error('[user-profile] getAddresses error', err)
    return []
  }
}

export async function addAddress(payload: Partial<Address>): Promise<Address | null> {
  try {
    // Map frontend address shape to backend expected shape and remove undefined fields
    const rawBody: any = {
      label: (payload as any).label,
      line1: payload.addressLine1 || (payload as any).line1,
      line2: payload.addressLine2 || (payload as any).line2,
      city: payload.city,
      country: payload.country,
      postalCode: payload.postalCode,
      isDefault: typeof payload.isDefault === 'boolean' ? payload.isDefault : false,
    }

    const body = Object.entries(rawBody).reduce((acc: any, [k, v]) => {
      if (v !== undefined && v !== null) acc[k] = v
      return acc
    }, {})

    const res = await apiClient.post('/api/UserProfile/addresses', body)
    const data = res.data || res.data?.data || null
    if (!data) return null

    const a = Array.isArray(data) ? data[0] : data
    const mapped: Address = {
      id: a.id || a.addressId || a.addressID || undefined,
      label: a.label || rawBody.label || undefined,
      addressLine1: a.line1 || a.addressLine1 || rawBody.line1 || undefined,
      addressLine2: a.line2 || a.addressLine2 || rawBody.line2 || undefined,
      city: a.city || rawBody.city || undefined,
      country: a.country || rawBody.country || undefined,
      postalCode: a.postalCode || rawBody.postalCode || undefined,
      isDefault: !!a.isDefault || !!rawBody.isDefault || false,
    }

    return mapped
  } catch (err) {
    const e = err as any
    console.error('[user-profile] addAddress error', {
      message: e?.message,
      status: e?.statusCode || e?.response?.status,
      response: e?.response?.data,
      url: e?.config?.url,
      payload: payload,
    })
    return null
  }
}

export async function updateAddress(addressId: string, payload: Partial<Address>): Promise<Address | null> {
  try {
    // Map frontend address keys to backend expected keys and strip undefined
    const rawBody: any = {
      label: (payload as any).label,
      line1: (payload as any).addressLine1 || (payload as any).line1,
      line2: (payload as any).addressLine2 || (payload as any).line2,
      city: payload.city,
      country: payload.country,
      postalCode: payload.postalCode,
      isDefault: typeof payload.isDefault === 'boolean' ? payload.isDefault : false,
    }

    const body = Object.entries(rawBody).reduce((acc: any, [k, v]) => {
      if (v !== undefined && v !== null) acc[k] = v
      return acc
    }, {})

    const res = await apiClient.put(`/api/UserProfile/addresses/${addressId}`, body)
    const data = res.data || res.data?.data || null
    if (!data) {
      // success with no body
      // return a best-effort mapped object from the request body + id
      return {
        id: addressId,
        label: rawBody.label,
        addressLine1: rawBody.line1,
        addressLine2: rawBody.line2,
        city: rawBody.city,
        country: rawBody.country,
        postalCode: rawBody.postalCode,
        isDefault: !!rawBody.isDefault,
      }
    }

    const a = Array.isArray(data) ? data[0] : data
    const mapped: Address = {
      id: a.id || a.addressId || addressId,
      label: a.label || rawBody.label || undefined,
      addressLine1: a.line1 || a.addressLine1 || rawBody.line1 || undefined,
      addressLine2: a.line2 || a.addressLine2 || rawBody.line2 || undefined,
      city: a.city || rawBody.city || undefined,
      country: a.country || rawBody.country || undefined,
      postalCode: a.postalCode || rawBody.postalCode || undefined,
      isDefault: !!a.isDefault || !!rawBody.isDefault || false,
    }

    return mapped
  } catch (err) {
    const e = err as any
    console.error('[user-profile] updateAddress error', {
      message: e?.message,
      status: e?.statusCode || e?.response?.status,
      response: e?.response?.data,
      url: e?.config?.url,
      payload: payload,
    })
    return null
  }
}

export async function deleteAddress(addressId: string): Promise<boolean> {
  try {
    const res = await apiClient.delete(`/api/UserProfile/addresses/${addressId}`)
    return res.status === 200 || res.status === 204
  } catch (err) {
    console.error('[user-profile] deleteAddress error', err)
    return false
  }
}

export async function setDefaultAddress(addressId: string): Promise<boolean> {
  try {
    const res = await apiClient.post(`/api/UserProfile/addresses/${addressId}/set-default`)
    // Accept success when server returns 200/204 or any non-empty body
    if (!res) return false
    if (res.status === 200 || res.status === 204) return true
    if (res.data) return true
    return false
  } catch (err) {
    const e = err as any
    console.error('[user-profile] setDefaultAddress error', {
      message: e?.message,
      status: e?.response?.status,
      response: e?.response?.data,
      url: e?.config?.url,
      addressId,
    })
    return false
  }
}

export async function getCurrentMode(): Promise<string | null> {
  try {
    const res = await apiClient.get('/api/UserProfile/current-mode')
    return res.data?.mode || res.data || null
  } catch (err) {
    console.error('[user-profile] getCurrentMode error', err)
    return null
  }
}

export async function getRatings(): Promise<any> {
  try {
    const res = await apiClient.get('/api/UserProfile/ratings')
    // Normalize - API may wrap array in $values or data
    const raw = Array.isArray(res.data)
      ? res.data
      : res.data?.data && Array.isArray(res.data.data)
      ? res.data.data
      : res.data?.$values && Array.isArray(res.data.$values)
      ? res.data.$values
      : []

    const mapped: Rating[] = raw.map((r: any) => ({
      id: r.id || r.ratingId || undefined,
      score: typeof r.score === 'number' ? r.score : (typeof r.value === 'number' ? r.value : undefined),
      comment: r.comment || r.message || r.text || undefined,
      reviewer: r.reviewer || r.reviewerName || r.user || undefined,
      createdAt: r.createdAt || r.date || r.timestamp || undefined,
    }))

    return mapped
  } catch (err) {
    console.error('[user-profile] getRatings error', err)
    return []
  }
}

// Update profile - backend may accept PUT /api/UserProfile with JSON body
export async function updateProfile(payload: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const res = await apiClient.put('/api/UserProfile', payload)
    return res.data || null
  } catch (err) {
    console.error('[user-profile] updateProfile error', err)
    return null
  }
}
