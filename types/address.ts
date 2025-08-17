export const ADDRESS_TYPES = ['BUSINESS', 'BILLING', 'SHIPPING', 'OTHER'] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

export interface Address {
  type: AddressType
  isPrimary: boolean
  street: string
  street2?: string
  city: string
  state: string
  zipCode: string
  country: string
  reference?: string
  coordinates?: any
}
