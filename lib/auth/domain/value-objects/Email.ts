export class Email {
  private readonly value: string

  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new Error('Invalid email format')
    }
    this.value = email.toLowerCase().trim()
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    const minLength = 3
    const maxLength = 254

    if (!email || email.length < minLength || email.length > maxLength) {
      return false
    }

    if (!emailRegex.test(email)) {
      return false
    }

    const [localPart, domain] = email.split('@')
    if (localPart.length > 64) {
      return false
    }

    const domainParts = domain.split('.')
    if (domainParts.some(part => part.length > 63)) {
      return false
    }

    const suspiciousPatterns = [
      /\.\./,
      /^[.-]/,
      /[.-]$/,
      /[.-]@/,
      /@[.-]/,
    ]

    return !suspiciousPatterns.some(pattern => pattern.test(email))
  }

  getValue(): string {
    return this.value
  }

  getDomain(): string {
    return this.value.split('@')[1]
  }

  getLocalPart(): string {
    return this.value.split('@')[0]
  }

  getMasked(): string {
    const [localPart, domain] = this.value.split('@')
    if (localPart.length <= 3) {
      return `${localPart[0]}***@${domain}`
    }
    return `${localPart.substring(0, 2)}***@${domain}`
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}